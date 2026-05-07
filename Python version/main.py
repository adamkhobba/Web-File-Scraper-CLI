import os
import sys
import re
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
import questionary
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, DownloadColumn, TransferSpeedColumn, TimeRemainingColumn

console = Console()

def is_valid_url(url_string: str) -> bool:
    try:
        result = urlparse(url_string)
        return all([result.scheme, result.netloc])
    except Exception:
        return False

def download_file(url: str, dest: str, progress: Progress) -> None:
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        }
        with requests.get(url, stream=True, headers=headers) as response:
            if response.status_code != 200:
                console.print(f"[red]Failed HTTP {response.status_code} for {url}[/red]")
                return
            
            total_length = response.headers.get('content-length')
            if total_length:
                total_length = int(total_length)
            else:
                total_length = 0

            filename = os.path.basename(dest)
            task_id = progress.add_task(f"[{filename}]", total=total_length or None)

            with open(dest, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        progress.update(task_id, advance=len(chunk))
            
            progress.update(task_id, completed=total_length or 100)
    except Exception as e:
        console.print(f"[red]Error downloading {url}: {e}[/red]")
        if os.path.exists(dest):
            os.remove(dest)

def run_cli():
    console.print("\n[bold blue]🌐 Web File Scraper CLI[/bold blue]\n")

    # 1. Get Target URL
    target_url = questionary.text(
        "Enter the target URL to scrape:",
        default="https://www.alloschool.com/course/mathematiques-2eme-bac-sciences-mathematiques-a-biof",
        validate=lambda val: True if is_valid_url(val) else "Please enter a valid URL."
    ).ask()

    if not target_url:
        return

    # 2. Get Download Directory
    download_dir = questionary.text(
        "Enter the download directory path:",
        default="/mnt/d/test_script_python"
    ).ask()

    if not download_dir:
        return

    if not os.path.exists(download_dir):
        console.print(f"[yellow]Directory {download_dir} does not exist.[/yellow]")
        create_dir = questionary.confirm("Do you want to create it?", default=True).ask()
        
        if create_dir:
            os.makedirs(download_dir, exist_ok=True)
            console.print(f"[green]✔ Created directory: {download_dir}[/green]")
        else:
            console.print("[red]Aborting operation. A valid download directory is required.[/red]")
            sys.exit(0)

    # 3. File Extension Filter
    file_ext = questionary.text(
        'What file extension are you looking for? (e.g. pdf, zip). Leave empty for any "pdf" file:',
        default="pdf"
    ).ask()

    if file_ext is None:
        return

    # Fetching webpage
    with console.status("[bold green]Fetching webpage...[/bold green]") as status:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(target_url, headers=headers)
            response.raise_for_status()
            html = response.text
            console.print("[bold green]✔ Webpage fetched successfully.[/bold green]")
        except Exception as e:
            console.print("[bold red]✖ Error fetching the webpage.[/bold red]")
            console.print(f"[red]{e}[/red]")
            sys.exit(1)

    # Parsing and extracting links
    with console.status("[bold green]Extracting download links...[/bold green]") as status:
        soup = BeautifulSoup(html, 'html.parser')
        file_urls = []

        for a_tag in soup.find_all('a'):
            href = a_tag.get('href')
            if href:
                lower_href = href.lower()
                if lower_href.endswith(f".{file_ext}") or file_ext in lower_href:
                    absolute_url = urljoin(target_url, href)
                    if absolute_url not in file_urls:
                        file_urls.append(absolute_url)

    if not file_urls:
        console.print(f"[yellow]No files found matching the criteria '{file_ext}'.[/yellow]")
        return

    console.print(f"[bold green]✔ Found {len(file_urls)} file(s) to download.[/bold green]")

    # 4. Confirm Download
    proceed = questionary.confirm(
        f"Ready to download {len(file_urls)} files to {download_dir}?",
        default=True
    ).ask()

    if not proceed:
        console.print("[yellow]Download aborted by user.[/yellow]")
        return

    console.print(f"\n[bold blue]Starting downloads sequentially ({len(file_urls)} files)...[/bold blue]\n")

    progress = Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        "[progress.percentage]{task.percentage:>3.0f}%",
        "•",
        DownloadColumn(),
        "•",
        TransferSpeedColumn(),
        "•",
        TimeRemainingColumn(),
        console=console
    )

    with progress:
        for index, url in enumerate(file_urls):
            filename = url.split('/')[-1].split('?')[0]
            if not filename or '.' not in filename:
                filename = f"file_{index + 1}.{file_ext}"
            
            # Clean filename
            filename = re.sub(r'[^a-zA-Z0-9.-]', '_', filename)
            dest_path = os.path.join(download_dir, filename)

            console.print(f"[cyan]\n[{index + 1}/{len(file_urls)}] Preparing {filename}...[/cyan]")
            download_file(url, dest_path, progress)

    console.print("\n[bold green]✔ All downloads completed successfully![/bold green]\n")

if __name__ == "__main__":
    try:
        run_cli()
    except KeyboardInterrupt:
        console.print("\n[red]Process interrupted by user (SIGINT). Exiting gracefully...[/red]")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n[bold red]An unexpected error occurred:[/bold red] {e}")
        sys.exit(1)
