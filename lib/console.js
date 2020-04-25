const { magenta } = require('chalk');
const path = require('path');
const fs = require('fs');

const generateWordCountVector = require('hexo-related-posts/lib/tfidf/generateWordCountVector');
const resolveStemmer = require('hexo-related-posts/lib/tfidf/resolveStemmer');
const prepareReservedWords = require('hexo-related-posts/lib/text/prepareReservedWords');
const { cleanupHtml } = require('./cleanupHtml');

const generateSearchIndex = (hexo) =>
    function () {
        const { public_dir, log } = hexo;
        const config = hexo.config.search_indexer;

        return hexo.call('generate', {}).then(function () {
            log.info('Start generating search index');

            const searchIndexFile = config.searchIndexFile;
            const stemmersList = config.stemmers;
            const stemmers = stemmersList.map(resolveStemmer);
            const reservedWords = prepareReservedWords(config.reserved);

            const contents = config.content
                ? hexo.locals.get('posts').data.reduce((result, { path, content }) => {
                      result[path] = cleanupHtml(content);
                      return result;
                  }, {})
                : {};

            const words = hexo.locals
                .get('posts')
                .data.map(({ title, keywords, description, raw, tags, categories, path }) => ({
                    title,
                    keywords,
                    description,
                    raw,
                    path,
                    tags: tags.data.map((tag) => tag.name).join(' '),
                    categories: categories.data.map((category) => category.name).join(' ')
                }))
                .map(({ title, keywords, description, raw, path, tags, categories }) => {
                    return {
                        path,
                        content: [
                            generateWordCountVector(title || '', reservedWords, stemmers),
                            generateWordCountVector(keywords || '', reservedWords, stemmers),
                            generateWordCountVector(description || '', reservedWords, stemmers),
                            generateWordCountVector(tags, reservedWords, stemmers),
                            generateWordCountVector(categories, reservedWords, stemmers),
                            generateWordCountVector(raw, reservedWords, stemmers)
                        ].reduce((result, current) => {
                            for (const key of Object.keys(current)) {
                                if (result[key]) {
                                    result[key] = result[key] + current[key];
                                } else {
                                    result[key] = current[key];
                                }
                            }
                            return result;
                        }, {})
                    };
                })
                .reduce((result, current) => {
                    const { path, content } = current;
                    for (const word of Object.keys(content)) {
                        const wordContent = result[word] || {};
                        result[word] = {
                            ...wordContent,
                            [path]: content[word] + (wordContent[path] || 0)
                        };
                    }
                    return result;
                }, {});

            if (!fs.existsSync(public_dir)) {
                fs.mkdirSync(public_dir);
            }

            const searchIndexPath = path.join(public_dir, searchIndexFile);

            fs.writeFileSync(searchIndexPath, JSON.stringify(config.content ? { words, contents } : words, null, 2), 'utf-8');

            log.info('Search index generated: %s', magenta(searchIndexPath));
            log.info('Search index done');
        });
    };

module.exports = generateSearchIndex;
