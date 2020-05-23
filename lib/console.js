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
            const includes = config.include || [];
            const minWordLength = config.minWordLength || 5;

            const data = config.content
                ? hexo.locals.get('posts').data.reduce((result, post) => {
                      const { path, content } = post;

                      result[path] = {};
                      for (const include of includes) {
                          if (include.name) {
                              result[path][include.name] = include.cleanup
                                  ? (cleanupHtml(post[include.name]) || []).join(' ')
                                  : post[include.name];
                          }
                      }

                      if (config.content) {
                          result[path].content = cleanupHtml(content);
                      }

                      return result;
                  }, {})
                : {};

            const words = hexo.locals
                .get('posts')
                .data.map((post) => ({
                    ...post,
                    tags: post.tags.data.map((tag) => tag.name).join(' '),
                    categories: post.categories.data.map((category) => category.name).join(' ')
                }))
                .map((post) => {
                    const { title, keywords, description, raw, path, tags, categories } = post;
                    const content = [
                        generateWordCountVector(title || '', reservedWords, stemmers, minWordLength),
                        generateWordCountVector(keywords || '', reservedWords, stemmers, minWordLength),
                        generateWordCountVector(description || '', reservedWords, stemmers, minWordLength),
                        generateWordCountVector(tags, reservedWords, stemmers, minWordLength),
                        generateWordCountVector(categories, reservedWords, stemmers, minWordLength),
                        generateWordCountVector(raw, reservedWords, stemmers, minWordLength)
                    ];

                    for (const include of includes) {
                        if (include.name && include.index) {
                            content.push(
                                generateWordCountVector(
                                    cleanupHtml(post[include.name] || '').join(' '),
                                    reservedWords,
                                    stemmers,
                                    minWordLength
                                )
                            );
                        }
                    }

                    return {
                        path,
                        content: content.reduce((result, current) => {
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

            fs.writeFileSync(searchIndexPath, JSON.stringify({ words, data }, null, 2), 'utf-8');

            log.info('Search index generated: %s', magenta(searchIndexPath));
            log.info('Search index done');
        });
    };

module.exports = generateSearchIndex;
