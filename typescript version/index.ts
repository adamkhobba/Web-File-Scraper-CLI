import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { input, confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

// Helper to validate URLs
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Downloads a single file from a given URL to a destination path
 */
async function downloadFile(url: string, dest: string, progressBar: cliProgress.SingleBar): Promise<void> {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    });

    if (response.status !== 200) {
      progressBar.update({ status: chalk.red(`Failed HTTP ${response.status}`) });
      progressBar.stop();
      return;
    }

    const totalLength = response.headers['content-length'];
    if (totalLength) {
      progressBar.setTotal(parseInt(totalLength, 10));
    }

    let downloadedLength = 0;
    response.data.on('data', (chunk: Buffer) => {
      downloadedLength += chunk.length;
      progressBar.update(downloadedLength);
    });

    await pipeline(response.data, fs.createWriteStream(dest));

    // Set progress to max to ensure visual completion
    progressBar.update(progressBar.getTotal(), { status: chalk.green('Done') });
    progressBar.stop();
  } catch (error: any) {
    progressBar.update({ status: chalk.red('Error') });
    progressBar.stop();
    // Clean up partial files
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
  }
}

/**
 * Main function to interactively scrape the webpage and download files
 */
async function runCLI(): Promise<void> {
  console.log(chalk.bold.blue('\n🌐 Web File Scraper CLI\n'));

  // 1. Get Target URL
  const targetUrl = await input({
    message: 'Enter the target URL to scrape:',
    default: 'https://www.alloschool.com/course/mathematiques-2eme-bac-sciences-mathematiques-a-biof',
    validate: (val) => isValidUrl(val) || 'Please enter a valid URL.',
  });

  // 2. Get Download Directory
  const downloadDir = await input({
    message: 'Enter the download directory path:',
    default: '/mnt/d/test_script',
  });

  // Ensure download directory exists
  if (!fs.existsSync(downloadDir)) {
    console.log(chalk.yellow(`Directory ${downloadDir} does not exist.`));
    const createDir = await confirm({
      message: `Do you want to create it?`,
      default: true,
    });

    if (createDir) {
      fs.mkdirSync(downloadDir, { recursive: true });
      console.log(chalk.green(`✔ Created directory: ${downloadDir}`));
    } else {
      console.log(chalk.red('Aborting operation. A valid download directory is required.'));
      process.exit(0);
    }
  }

  // 3. File Extension Filter
  const fileExt = await input({
    message: 'What file extension are you looking for? (e.g. pdf, zip). Leave empty for any "pdf" file:',
    default: 'pdf',
  });

  // Fetching the webpage
  const spinner = ora('Fetching webpage...').start();
  let html = '';
  try {
    const { data } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    html = data;
    spinner.succeed(chalk.green('Webpage fetched successfully.'));
  } catch (error: any) {
    spinner.fail(chalk.red('Error fetching the webpage.'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  const $ = cheerio.load(html);
  const fileUrls: string[] = [];

  spinner.start('Extracting download links...');
  $('a').each((i, element) => {
    const href = $(element).attr('href');
    if (href) {
      const lowerHref = href.toLowerCase();
      // Check if it matches the requested extension
      if (lowerHref.endsWith(`.${fileExt}`) || lowerHref.includes(fileExt)) {
        const absoluteUrl = href.startsWith('http') ? href : new URL(href, targetUrl).toString();
        if (!fileUrls.includes(absoluteUrl)) {
          fileUrls.push(absoluteUrl);
        }
      }
    }
  });

  if (fileUrls.length === 0) {
    spinner.info(chalk.yellow(`No files found matching the criteria '${fileExt}'.`));
    return;
  }
  spinner.succeed(chalk.green(`Found ${fileUrls.length} file(s) to download.`));

  // 4. Confirm Download
  const proceed = await confirm({
    message: `Ready to download ${fileUrls.length} files to ${downloadDir}?`,
    default: true,
  });

  if (!proceed) {
    console.log(chalk.yellow('Download aborted by user.'));
    return;
  }

  console.log(chalk.blue(`\nStarting downloads sequentially (${fileUrls.length} files)...`));

  // Loop through URLs to download sequentially for a cleaner UI
  for (let index = 0; index < fileUrls.length; index++) {
    const url = fileUrls[index];
    let filename = url.split('/').pop()?.split('?')[0] || '';
    if (!filename || !filename.includes('.')) {
      filename = `file_${index + 1}.${fileExt}`;
    }
    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const destPath = path.join(downloadDir, filename);

    console.log(chalk.cyan(`\n[${index + 1}/${fileUrls.length}] Downloading ${filename}...`));

    // Initialize progress bar for this file
    const bar = new cliProgress.SingleBar({
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} | {percentage}% | {status} | {value}/{total} Bytes',
    }, cliProgress.Presets.shades_classic);

    bar.start(100, 0, { status: chalk.yellow('Starting...') });

    await downloadFile(url, destPath, bar);
  }

  console.log(chalk.green.bold('\n✔ All downloads completed successfully!\n'));
}

// Handle unexpected exits gracefully
process.on('SIGINT', () => {
  console.log(chalk.red('\nProcess interrupted by user (SIGINT). Exiting gracefully...'));
  process.exit(0);
});

// Start the CLI
runCLI().catch(err => {
  console.error(chalk.red('\nAn unexpected error occurred:'), err);
  process.exit(1);
});
