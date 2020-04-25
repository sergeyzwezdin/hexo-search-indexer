const Entities = require('html-entities').XmlEntities;
const entities = new Entities();

const removeCodeBlocksRegex = /<pre.*?>.+?<\/pre>/gis;
const removeHtmlTagsRegex = /<\/?\w+.*?>/gis;

const cleanupHtml = (source) =>
    String(source || '')
        .replace(removeCodeBlocksRegex, '')
        .replace(removeHtmlTagsRegex, '')
        .split('\n')
        .filter((s) => s.trim() !== '')
        .map((s) => entities.decode(s).trim());

module.exports = { cleanupHtml };
