hexo.config.search_indexer = Object.assign(
    {
        enable: true,
        content: true,
        stemmers: ['en', 'ru'],
        reserved: [],
        searchIndexFile: 'search.json'
    },
    hexo.config.search_indexer
);

if (hexo.config.search_indexer.enable) {
    hexo.extend.console.register('generate-search-index', 'Generate JSON file with search index.', {}, require('./lib/console')(hexo));
}
