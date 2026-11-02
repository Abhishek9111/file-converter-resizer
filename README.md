# File Converter & Resizer

A browser-based tool for editing images and converting files. Everything runs on your device, so your files are never uploaded to a server.

## Features

### Image tools

Upload, drag in, or paste a PNG, JPG, WebP, GIF, or BMP image, then:

- **Resize** by width and height, by percentage, or with presets for Instagram, YouTube, Facebook, X, and Full HD
- **Crop** freely or to a 1:1, 4:3, 16:9, or 3:2 ratio
- **Rotate and flip** in either direction
- **Compress** with a quality slider or a target file size from 25 KB to 5 MB
- **Convert** to PNG, JPG, or WebP

### File converter

| From | To |
| --- | --- |
| JSON | CSV |
| CSV | JSON |
| Markdown or TXT | HTML |
| DOCX | PDF |
| Any file | Base64 |
| Base64 | File |

The file type is detected automatically from its extension. To encode a file as Base64, choose **File → Base64** first.

## Getting started

You need [Node.js](https://nodejs.org/) 18, 20, or 22 and later.

```bash
git clone https://github.com/Abhishek9111/file-converter-resizer.git
```

```bash
cd file-converter-resizer
```

```bash
npm install
```

```bash
npm run dev
```

Then open the local address shown in your terminal, usually http://localhost:5173.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the production build locally |

## Project structure

```text
src/
├── App.jsx                 # App state and event handlers
├── App.css                 # Styles
├── components/             # UI components
└── utils/
    ├── imageProcessor.js   # Canvas drawing, compression, and sizing
    └── fileConverter.js    # File conversions and DOCX pagination
```

`index-standalone.html` is the original single-file version of the app, from before the move to React.

## Built with

- [React](https://react.dev/) and [Vite](https://vite.dev/)
- [mammoth](https://github.com/mwilliamson/mammoth.js) to read DOCX files
- [html2canvas](https://html2canvas.hertzen.com/) and [jsPDF](https://github.com/parallax/jsPDF) to generate PDFs
- [marked](https://marked.js.org/) to convert Markdown

## Limitations

- **DOCX to PDF:** pages are saved as images, so text in the PDF can't be selected or searched. Headings, lists, tables, and images carry over, but the original fonts and layout don't.
- **GIFs:** animated GIFs are reduced to their first frame.
- **Image size:** resized images are limited to 10,000 px on either side.
- **Base64 input:** pasted strings must be longer than 10 characters to decode.
