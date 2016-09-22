# Getting Started

Install with npm using terminal.

```bash
npm i -g xin-cli
```

If the installation process error you might want to use `sudo`.

When installation process finished, you will have `xin` command line to work with.

## Get help

```bash
xin help
```

## Initialize new xin project

```bash
xin init <project_dir>
```

## Serve project

`cd` to your project directory and then run `xin serve`

```bash
cd <project_dir>
xin serve
```

Open browser and type the url you've got from cli.

The command will watch any file changes and update those changes in your browser automatically.

## Generate static page documentation

```bash
xin doc <project_dir> -o <destination_dir>
```
