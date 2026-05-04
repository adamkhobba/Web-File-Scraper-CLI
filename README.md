# 🕷️ Web Scrapping Scripts

Scrape & download dozens of files from any website in one command. Available in **TypeScript** and **Python**.

---

## ✨ Features

| Feature                  | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| **Smart file discovery** | Scans `<a>`, `<link>`, `<img>`, `<source>` tags automatically    |
| **Extension filtering**  | Filter by individual extensions (`.pdf`, `.zip`) or preset groups |
| **Preset groups**        | `documents`, `images`, `audio`, `video`, `archives`, `code`, `all` |
| **Concurrent downloads** | Download multiple files in parallel (configurable)               |
| **Retry logic**          | Automatic retries with exponential back-off                      |
| **Progress bars**        | Visual download progress for each file                           |
| **Custom CSS selectors** | Target specific elements on the page                             |
| **List-only mode**       | Preview discovered links without downloading                     |

---

## 🚀 Quick Start

### TypeScript Version

```bash
cd "typescript version"
npm install
npx tsx main.ts -u https://example.com/resources
```

### Python Version

```bash
cd "Python version"
pip install requests beautifulsoup4 tqdm colorama
python main.py -u https://example.com/resources
```

---

## 📖 Usage Examples

```bash
# Download ALL linked files from a page
python main.py -u https://example.com/downloads

# Download only PDFs and ZIPs
python main.py -u https://example.com -e .pdf,.zip

# Use a preset group (documents = pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt)
python main.py -u https://example.com -e documents

# Download images only
npx tsx main.ts -u https://example.com -e images

# List files without downloading
python main.py -u https://example.com --list-only

# Custom output directory & higher concurrency
npx tsx main.ts -u https://example.com -o ./my_files -c 5

# Use a custom CSS selector to target specific links
python main.py -u https://example.com -s "div.resources a[href]"
```

---

## ⚙️ CLI Options

| Flag                    | Default        | Description                                  |
| ----------------------- | -------------- | -------------------------------------------- |
| `-u, --url`             | **(required)** | URL of the page to scrape                    |
| `-o, --output`          | `./downloads`  | Output directory                             |
| `-e, --extensions`      | `all`          | Comma-separated extensions or group names    |
| `-c, --concurrency`     | `3`            | Max concurrent downloads                     |
| `-r, --retries`         | `3`            | Retry attempts per file                      |
| `-t, --timeout`         | `30000` / `30` | Timeout (ms for TS, seconds for Python)      |
| `-s, --selector`        | *(auto)*       | Custom CSS selector                          |
| `--list-only`           | `false`        | Only list files, don't download              |

---

## 📁 Extension Groups

| Group       | Extensions                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| `documents` | `.pdf` `.doc` `.docx` `.xls` `.xlsx` `.ppt` `.pptx` `.txt` `.csv` `.odt`  |
| `images`    | `.jpg` `.jpeg` `.png` `.gif` `.svg` `.webp` `.bmp` `.ico` `.tiff`          |
| `audio`     | `.mp3` `.wav` `.ogg` `.flac` `.aac` `.wma` `.m4a`                          |
| `video`     | `.mp4` `.avi` `.mkv` `.mov` `.wmv` `.flv` `.webm`                          |
| `archives`  | `.zip` `.rar` `.7z` `.tar` `.gz` `.bz2` `.xz`                              |
| `code`      | `.js` `.ts` `.py` `.java` `.cpp` `.c` `.h` `.css` `.html` `.json`          |

---

## 📜 License

MIT