import { ChatOpenAI } from "@langchain/openai";
import { OpenAI } from "openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "langchain/document";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const model = new ChatOpenAI({});

const prompt = ChatPromptTemplate.fromTemplate(
  `Answer the user's question. 
  Context: {context}
  Question : {input}
  `
);

const chain = await createStuffDocumentsChain({
  llm: model,
  prompt,
});

async function chat() {
  // Documents
  const loader = new PDFLoader("../data/pps_rules.pdf");
  const docs = await loader.load();

  // ==============================
  // 단일
  // ==============================
  // const res = await chain.invoke({
  //   input: "16조 복무자세 각호는 뭐야",
  //   context: docs,
  // });

  // console.log(res);

  // ==============================
  // DB 체인
  // ==============================
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 50,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  const retriever = vectorStore.asRetriever({
    k: 2,
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: chain,
    retriever,
  });

  const res = await retrievalChain.invoke({
    input: "16조 복무자세 각호는 뭐야",
  });

  console.log(res);
}

chat();
