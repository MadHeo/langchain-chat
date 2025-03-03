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

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      position: "left",
      type: "text",
      text: "안녕하세요! 무엇을 도와드릴까요?",
      date: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [retrievalChain, setRetrievalChain] = useState(null);
  const [chain, setChain] = useState(null);

  const extractTextFromPDF = async (pdfUrl) => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();

        // 페이지에서 텍스트 항목 확인
        console.log(`Page ${i}:`, text.items);

        textContent += text.items.map((item) => item.str).join(" ") + "\n";
      }

      return textContent;
    } catch (error) {
      console.error("PDF를 처리하는 중 오류 발생:", error);
      return "";
    }
  };

  const initializeChain = async () => {
    try {
      const pdfText = await extractTextFromPDF("/pps_rules.pdf");

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 50,
      });

      // 문자열을 Document 객체 배열로 변환
      const docs = [new Document({ pageContent: pdfText })];

      const splitDocs = await splitter.splitDocuments(docs); // 배열 전달

      const embeddings = new OpenAIEmbeddings({
        apiKey:
          "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",
      });
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
      );

      const retriever = vectorStore.asRetriever({ k: 2 });

      const model = new ChatOpenAI({
        apiKey:
          "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",
      });
      const prompt = ChatPromptTemplate.fromTemplate(`
        Answer the user's question. 
        Context: {context}
        Question : {input}
      `);

      const basicChain = await createStuffDocumentsChain({
        llm: model,
        prompt,
      });

      const retrieverChain = await createRetrievalChain({
        combineDocsChain: basicChain,
        retriever,
      });

      setChain(basicChain);
      setRetrievalChain(retrieverChain);
    } catch (error) {
      console.error("PDF 로드 중 오류 발생:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !retrievalChain) return;

    const userMessage = {
      position: "right",
      type: "text",
      text: inputText,
      date: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    try {
      const response = await retrievalChain.invoke({ input: inputText });

      const aiMessage = {
        position: "left",
        type: "text",
        text: response.answer,
        date: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI 응답 오류:", error);
      setMessages((prev) => [
        ...prev,
        {
          position: "left",
          type: "text",
          text: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.",
          date: new Date(),
        },
      ]);
    }
  };

  useEffect(() => {
    initializeChain();
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="700px"
      p={2}
      bgcolor="#d9d9d9"
    >
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">PPS 내규</Typography>
      </Paper>

      <Box
        flexGrow={1}
        overflow="auto"
        p={2}
        bgcolor="gray"
        borderRadius={2}
        color={"black"}
      >
        {messages.map((msg, index) => (
          <MessageBox
            key={index}
            position={msg.position}
            type={msg.type}
            text={msg.text}
            date={msg.date}
          />
        ))}
      </Box>

      <Box display="flex" p={1} mt={1} bgcolor="white" borderRadius={2}>
        <Input
          inputStyle={{ backgroundColor: "white", minWidth: 0 }}
          placeholder="메시지를 입력하세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button text="전송" onClick={sendMessage} />
      </Box>
    </Box>
  );
};

export default Chat;
