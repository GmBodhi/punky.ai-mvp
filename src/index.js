require("dotenv").config();

const { GPT } = require("./gpt");
const { PineConeInstance } = require("./pinecone");
const config = require("./config");
const { WebSpider } = require("./crawl");

process.env.OPENAI_APIKEY;

const openai = new GPT({
    apiKey: config.OPENAI_APIKEY,
});

const pinecone = new PineConeInstance({
    indexName: config.indexName,
    apiKey: config.PINECONE_APIKEY,
    environment: config.PINECONE_ENVIRONMENT,
});

const spider = new WebSpider();

(async () => {
    //

    await spider.launch();

    const html = await spider.crawl("https://punky.ai/");

    // console.log(spider.detectPaths(html));

    const data = spider.makeTextFromDOM(html);

    console.log(data);

    // const models = await openai.listModels();

    // console.log(models);

    // const embededData = await openai.createEmbedding(data);

    // console.log(embededData)

    //
})();
