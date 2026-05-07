# 🌐 Web File Scraper CLI

An interactive command-line tool to scrape and download files from any website. Available in both **TypeScript** and **Python**.

---

## ✨ Features

- **Interactive CLI**: Easy-to-use prompts for URL, download directory, and file extension.
- **Smart File Discovery**: Scans webpage links (`<a>` tags) automatically to find files matching your desired extension.
- **Beautiful Progress Bars**: Real-time visual download progress for each file.
- **Sequential Downloading**: Downloads files one by one to avoid overwhelming the server or your connection.
- **Robust Error Handling**: Gracefully handles failed downloads and continues with the rest of the files.

---

## 🚀 Quick Start

### Python Version

The Python version uses `BeautifulSoup` for parsing and `Rich` for beautiful terminal output.

```bash
cd "Python version"

# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the script
python main.py
```

### TypeScript Version

The TypeScript version uses `Cheerio` for parsing and `@inquirer/prompts` for the interactive CLI.

```bash
cd "typescript version"

# 1. Install dependencies
npm install

# 2. Run the script
npx tsx index.ts
```

---

## 📖 Usage Guide

Once you run the script, you will be prompted interactively for the following:

1. **Target URL**: The webpage you want to scrape files from.
   *Example: `https://www.example.com/downloads`*
2. **Download Directory**: Where you want to save the downloaded files.
   *Example: `./downloads` or `/mnt/d/files`*
   *(If the directory doesn't exist, the script will offer to create it for you).*
3. **File Extension**: The type of file you want to target.
   *Example: `pdf`, `zip`, `mp3`. Leave blank to default to `pdf`.*

The script will fetch the page, find all links matching your extension, and ask for final confirmation before starting the downloads.

---

## 📜 License

MIT

### 🔗 Project Story
Check out the project announcement and demo discussion on [LinkedIn](https://www.linkedin.com/posts/mr-adam-khobba-65b70227a_beautifulsoup-requests-rich-ugcPost-7458112020907982848-j_cx?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEQXhScBviSM2m_e6f0ux9A8QvXhzeIBJ9Y).
