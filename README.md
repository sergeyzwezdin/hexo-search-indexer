# hexo-search-indexer ![Publish on NPM](https://github.com/sergeyzwezdin/hexo-search-indexer/workflows/Publish%20on%20NPM/badge.svg) ![](https://img.shields.io/npm/v/hexo-search-indexer)

`hexo-search-indexer` is a plugin for Hexo static site generator that generates JSON file that contains all data to implement site search. It's convenient to use with serverless app that searches on your website.

* Generates **search-ready JSON file** with all data of the website.
* Supports **a few different languages**, including English, French, Russian, Italian, Japanese, and many others.
* Allows to define **"reserved" words** that won't be split during word normalize (e.g. `ASP.NET` will not be split into `ASP` and `NET`).
* Optionally can include non-stemmed post content in the search index.

## How it works

1. The plugin scans all posts on the website and extracts words for every post.
2. For every word [stemmers](https://github.com/NaturalNode/natural#stemmers) are applied.
3. All posts scanned to find which words they contain.
4. The words dictionary saves into JSON file.
5. Next you can upload this file into you app that handles search requests. For example, it's very convenient to use serverless application to do the search. 👌

## Requirements
- Hexo: 5.x
- Node 12+

## Usage

1. Install the plugin using npm:
```bash
$ npm install hexo-search-indexer --save-dev
```
2. Add `search_indexer` to Hexo config file (see details [below](#Configuration)).
3. Run `npx hexo generate-search-index`
4. `search.json` file will appear in the output folder.

## Configuration

To configure the plugin add `search_indexer` to Hexo config file. Example:

```yaml

search_indexer:
    enabled: true
    content: true
    include:
        - name: title
          cleanup: true
          index: true
    stemmers:
        - en
        - ru
    reserved:
        - asp.net
        - vs.net
        - ado.net
        - .net
    minWordLength: 5
    searchIndexFile: search.json
```

| Key | Required | Default value | Description |
| --- | --- | --- | --- |
| `enabled` | `no` | `true` | Flag to disable plugin execution. |
| `content` | `no` | `true` | Whether clean content should be included into index file as well. If `false` only words dictionary will be included in the index. |
| `include` | `no` | `[title]` | Array of properties that should be included into index file. |
| `include[].name` | `yes` | | Property name that should be included into index file. This is the name of `post` object property. |
| `include[].cleanup` | `yes` | | Whether property value should be cleaned up during indexing. |
| `include[].index` | `yes` | | Whether property value should be indexed (included into `words` section). |
| `stemmers` | `no` | `[en, ru]` | The plugin "normailze" the text by clearing symbols from initial text. One of the technique is stemming. This param defines which languages should be used to stem the words. Possible values: `nl`, `en`, `fr`, `id`, `it`, `jp`, `no`/`nb`/`nn`, `pt`, `ru`, `sv`. Check [Natural](https://github.com/NaturalNode/natural#stemmers) library for more details. |
| `reserved` | `no` | `[]` | The array of the reserved words that won't be processed during words normalization. For example, `ASP.NET` will be splitted into `ASP` and `NET` by default. If you want to preserve this, you need to add this to `reserved` config. |
| `minWordLength` | `no` | `5` | Minimum word length. The words shorter than this param will be ignored. |
| `searchIndexFile` | `no` | `search.json` | Output file name. |
