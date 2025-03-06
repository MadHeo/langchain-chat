import React, { useEffect, useState } from "react";
import { MessageBox, Input, Button } from "react-chat-elements";
import "react-chat-elements/dist/main.css";
import { Box, Paper, Typography } from "@mui/material";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { Document } from "langchain/document"; // LangChain의 Document 사용
import * as pdfjsLib from "pdfjs-dist/webpack"; // pdfjs-dist 로드
import axios from "axios";

const ChatFromApi = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSend = async () => {
    if (!question.trim()) return;

    const response = await axios.post("http://172.28.128.1:5000/chat", {
      question,
    });
    setAnswer(response.data.answer);
  };

  return (
    <div>
      <h2>AI Chat</h2>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="질문을 입력하세요..."
      />
      <button onClick={handleSend}>보내기</button>
      <div>
        <strong>답변:</strong> {answer}
      </div>
    </div>
  );
};

export default ChatFromApi;
