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

export default function ChatFromApi() {
  //AI 답변
  const [messages, setMessages] = useState([
    {
      position: "left",
      type: "text",
      text: "안녕하세요! 무엇을 도와드릴까요?",
      date: new Date(),
    },
  ]);
  //사람 질문
  const [inputText, setInputText] = useState("");

  //메세지 전송 및 답변 세팅
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    //질문 말풍선
    const userMessage = {
      position: "right",
      type: "text",
      text: inputText,
      date: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        question: inputText,
      });

      //대답 말풍선
      const answerMessage = {
        position: "left",
        type: "text",
        text: res.data.answer || "죄송합니다. 오류가 발생했습니다.",
        date: new Date(),
      };

      setMessages((prev) => [...prev, answerMessage]);
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

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        height="700px"
        p={2}
        maxWidth={"420px"}
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
          textAlign={"left"}
        >
          {messages.map((msg, index) => (
            <MessageBox
              key={index}
              position={msg.position}
              type={msg.type}
              text={
                <>
                  {msg.text.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </>
              }
              date={msg.date}
            />
          ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            padding: "4px",
            marginTop: "8px",
            backgroundColor: "white",
            borderRadius: "8px",
          }}
        >
          <Box sx={{ display: "flex", width: "100%" }}>
            <Input
              inputStyle={{
                backgroundColor: "white",
                minWidth: 0,
                display: "flex",
              }}
              placeholder="메시지를 입력하세요..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
          </Box>
          <Box sx={{ display: "flex", width: "50px" }}>
            <Button text="전송" onClick={sendMessage} />
          </Box>
        </Box>
      </Box>
    </>
  );
}
