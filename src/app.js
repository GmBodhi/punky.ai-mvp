const { GPT } = require("./gpt");
const { PineConeInstance } = require("./pinecone");
const config = require("./config");
const { WebSpider } = require("./crawl");
const { Prisma } = require("./prisma");

//
// INIT
//

const openai = new GPT({
    apiKey: config.OPENAI_APIKEY,
});

const pinecone = new PineConeInstance({
    indexName: config.indexName,
    apiKey: config.PINECONE_APIKEY,
    environment: config.PINECONE_ENVIRONMENT,
});

const spider = new WebSpider();

const prisma = new Prisma();

//

async function init() {
    await spider.launch();
    await pinecone.init();
    await prisma.conn();
}

async function close() {
    await spider.close();
    await prisma.disconn();
}

/**
 * @param {string} URL
 */
async function getURLs(URL) {
    const html = await spider.crawl(URL);
    return spider.detectPaths(html, URL);
}

//

/**
 * @param {{data: string; vector: import("./pinecone").Vector}[]} data
 * @param {string} namespace
 */
async function uploadData(data, namespace) {
    const upsertedData = await prisma.writeDocuments(data.map((d) => ({ content: d.data, namespace })));

    return await pinecone
        .upsert(
            data.map((d, i) => ({ ...d.vector, metadata: { id: upsertedData.at(i)?.id } })),
            namespace
        )
        .catch((e) => e);
}

//

/**
 * @param {import("./gpt").EmbeddingData[]} data
 * @param {string} url
 * @param {string} mainUrl
 */
const parseData = (data, url, mainUrl) => ({ values: data[0].embedding, id: url, metadata: { mainUrl } });
//

/** @param {string} url */
async function processPage(url) {
    const html = await spider.crawl(url);

    const data = spider.makeTextFromDOM(html);

    // /** @type {import("./gpt").EmbeddingResponse|null} */
    const embededData = await openai.createEmbedding(data).catch((e) => null);
    if (!embededData?.data) throw new Error("GPT: Request not satisfied");

    return embededData.data;
}

module.exports = {
    processPage,
    parseData,
    getURLs,
    init,
    close,
    uploadData,
    pinecone,
};
