import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

// Target URL to scrape
const TARGET_URL: string = 'https://www.alloschool.com/course/mathematiques-2eme-bac-sciences-mathematiques-a-biof'; // Example URL

// Directory to save downloaded files
const DOWNLOAD_DIR: string = '/mnt/d/test_script';

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * Downloads a single file from a given URL to a destination path
 * @param url - The URL of the file to download
 * @param dest - The local path to save the file
 */
async function downloadFile(url: string, dest: string): Promise<void> {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        // Use a realistic user-agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    });

    // Check if the request was successful
    if (response.status !== 200) {
      console.error(`Failed to download ${url}: HTTP ${response.status}`);
      return;
    }

    // Pipe the response stream directly to the file system (memory efficient)
    await pipeline(response.data, fs.createWriteStream(dest));
    console.log(`Successfully downloaded: ${path.basename(dest)}`);
  } catch (error: any) {
    console.error(`Error downloading ${url}:`, error.message);

    // Clean up partial/corrupted files if download fails
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
  }
}

/**
 * Main function to scrape the webpage and download files concurrently
 */
async function scrapeAndDownload(): Promise<void> {
  try {
    console.log(`Fetching webpage: ${TARGET_URL}`);
    const { data: html } = await axios.get(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    const $ = cheerio.load(html);
    const fileUrls: string[] = [];

    // Alloschool typically has download links or PDF links.
    // This selector finds all 'a' tags with an href ending in .pdf or containing 'pdf'
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      // Identify links that look like downloads
      if (href && (href.endsWith('.pdf') || href.includes('pdf'))) {
        const absoluteUrl = href.startsWith('http') ? href : new URL(href, TARGET_URL).toString();
        // Avoid duplicate links
        if (!fileUrls.includes(absoluteUrl)) {
          fileUrls.push(absoluteUrl);
        }
      }
    });

    if (fileUrls.length === 0) {
      console.log('No files found to download on this page.');
      console.log('Hint: The selector may need adjusting to match the exact HTML structure of the page.');
      return;
    }

    console.log(`Found ${fileUrls.length} file(s) to download.`);

    // Map each URL to a download Promise to execute them concurrently
    const downloadPromises = fileUrls.map((url, index) => {
      // Create a sensible filename, extracting it from the URL
      let filename = url.split('/').pop()?.split('?')[0] || '';
      if (!filename || !filename.includes('.')) {
        filename = `file_${index + 1}.pdf`;
      }
      // handle query params in filename to avoid invalid characters
      filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

      const destPath = path.join(DOWNLOAD_DIR, filename);

      return downloadFile(url, destPath);
    });

    // Wait for all downloads to finish concurrently
    await Promise.allSettled(downloadPromises);
    console.log('All downloads completed!');

  } catch (error: any) {
    console.error('Error fetching the webpage:', error.message);
  }
}

// Start the script
scrapeAndDownload();
