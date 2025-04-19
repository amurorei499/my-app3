// /app/viewdata/simple/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Button,
} from "@chakra-ui/react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { AttendanceData } from "@/app/utils/attendanceData";

export default function SimpleDataView() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得関数
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // シンプルに全データを取得
      const attendanceRef = collection(db, "attendanceCreate");
      const attendanceQuery = query(attendanceRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(attendanceQuery);

      const data: AttendanceData[] = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as AttendanceData);
      });

      console.log("取得したデータ:", data);
      setAttendanceData(data);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="xl" mb={6}>勤怠データ (シンプル表示)</Heading>

      <Button
        colorScheme="blue"
        onClick={fetchAttendanceData}
        mb={6}
        isLoading={loading}
      >
        データを再取得
      </Button>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>データを読み込み中...</Text>
        </Box>
      ) : error ? (
        <Box textAlign="center" py={10} color="red.500">
          <Text>エラーが発生しました: {error}</Text>
        </Box>
      ) : attendanceData.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text>データがありません</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>日時</Th>
                <Th>氏名</Th>
                <Th>支店</Th>
                <Th>班</Th>
                <Th>ステータス</Th>
                <Th>詳細</Th>
                <Th>場所</Th>
              </Tr>
            </Thead>
            <Tbody>
              {attendanceData.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.timestamp}</Td>
                  <Td>{item.family_name} {item.name}</Td>
                  <Td>{item.branch || "-"}</Td>
                  <Td>{item.team || "-"}</Td>
                  <Td>{item.status_primary}</Td>
                  <Td>{item.status_secondary || "-"}</Td>
                  <Td>{item.location}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Box mt={4}>
        <Text fontSize="sm">取得件数: {attendanceData.length}件</Text>
        <Text fontSize="sm" mt={2}>
          データ確認用ページ（デバッグ表示）
        </Text>
      </Box>
    </Container>
  );
}
