// /app/viewdata/page.tsx
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
  Flex,
  Button,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { AttendanceData } from "@/app/utils/attendanceData";

// 支店アイコンコンポーネント - tomato.ggスタイル
const BranchIcon = ({ branch }: { branch: string }) => {
  const getBranchColor = (branch: string) => {
    switch (branch) {
      case "東京": return "red.500";
      case "大阪": return "blue.500";
      case "名古屋": return "green.500";
      default: return "gray.500";
    }
  };

  return (
    <Box
      w="18px"
      h="18px"
      borderRadius="full"
      bg={getBranchColor(branch)}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="white"
      fontWeight="bold"
      fontSize="10px"
      border="1px solid rgba(255,255,255,0.2)"
    >
      {branch.charAt(0)}
    </Box>
  );
};

export default function ViewDataPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [displayData, setDisplayData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // ソート状態
  const [sortField, setSortField] = useState<keyof AttendanceData | "">("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // マスターデータ（フィルターオプション用）
  const [branches, setBranches] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // マスターデータ取得
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const attendanceRef = collection(db, "attendanceCreate");
        const querySnapshot = await getDocs(attendanceRef);

        const branchSet = new Set<string>();
        const teamSet = new Set<string>();

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.branch) branchSet.add(data.branch);
          if (data.team) teamSet.add(data.team);
        });

        setBranches(Array.from(branchSet).sort());
        setTeams(Array.from(teamSet).sort());
      } catch (err) {
        console.error("マスターデータ取得エラー:", err);
      }
    };

    fetchMasterData();
  }, []);

  // データ取得関数
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const attendanceRef = collection(db, "attendanceCreate");
      let queryFilters = [];

      // フィルター条件の構築
      if (selectedBranch) {
        queryFilters.push(where("branch", "==", selectedBranch));
      }

      if (selectedTeam) {
        queryFilters.push(where("team", "==", selectedTeam));
      }

      if (selectedStatus) {
        queryFilters.push(where("status_primary", "==", selectedStatus));
      }

      // クエリの実行
      let finalQuery;
      if (queryFilters.length > 0) {
        finalQuery = query(attendanceRef, ...queryFilters);
      } else {
        finalQuery = query(attendanceRef);
      }

      const querySnapshot = await getDocs(finalQuery);

      const data: AttendanceData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceData[];

      setAttendanceData(data);
      sortData(data);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError("データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // フィルター変更時にデータ再取得
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedBranch, selectedTeam, selectedStatus]);

  // ソート関数
  const sortData = (data: AttendanceData[]) => {
    if (!sortField) {
      setDisplayData(data);
      return;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (sortField === "timestamp") {
        return sortDirection === "asc"
          ? new Date(aValue.toString()).getTime() - new Date(bValue.toString()).getTime()
          : new Date(bValue.toString()).getTime() - new Date(aValue.toString()).getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "ja")
          : bValue.localeCompare(aValue, "ja");
      }

      return 0;
    });

    setDisplayData(sorted);
  };

  // ソート状態変更時にデータソート
  useEffect(() => {
    sortData(attendanceData);
  }, [sortField, sortDirection, attendanceData]);

  // ソート処理
  const handleSort = (field: keyof AttendanceData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 日時フォーマット関数の修正
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // UTC時刻を直接取得
      const utcMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const utcDay = date.getUTCDate().toString().padStart(2, '0');
      const utcHours = date.getUTCHours().toString().padStart(2, '0');
      const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');

      return `${utcMonth}/${utcDay} ${utcHours}:${utcMinutes}`;
    } catch (e) {
      console.error("日時変換エラー:", e);
      return "日時不明";
    }
  }

  // ステータス色の取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case "出勤": return "green";
      case "退勤": return "blue";
      case "欠勤": return "red";
      case "公休": return "purple";
      default: return "gray";
    }
  };

  return (
    <Box minH="100vh" bg="#121212" color="white">
      <Container maxW="container.xl" py={4}>
        <Heading
          as="h1"
          size="lg"
          mb={4}
          bgGradient="linear(to-r, cyan.300, blue.500)"
          bgClip="text"
        >
          勤怠データ確認
        </Heading>

       {/* フィルターセクション - tomato.ggスタイル */}
        <Box
          mb={4}
          p={3}
          borderRadius="md"
          bg="#1A1A1A"
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.1)"
        >
        {/* 支店フィルター */}
        <Flex wrap="wrap" gap={2} mb={4}>
          <Text fontWeight="bold" mr={4} alignSelf="center" color="gray.300">支店:</Text>
          <Button
            size="sm"
            colorScheme={!selectedBranch ? "cyan" : "gray"}
            variant={!selectedBranch ? "solid" : "outline"}
            onClick={() => setSelectedBranch(null)}
          >
            全て
          </Button>
          {branches.map(branch => (
            <Button
              key={branch}
              size="sm"
              leftIcon={<BranchIcon branch={branch} />}
              colorScheme={selectedBranch === branch ? "cyan" : "gray"}
              onClick={() => setSelectedBranch(branch === selectedBranch ? null : branch)}
            >
              {branch}
            </Button>
          ))}
        </Flex>

        {/* 班フィルター */}
        <Flex wrap="wrap" gap={2} mb={4}>
          <Text fontWeight="bold" mr={4} alignSelf="center" color="gray.300">班:</Text>
          <Button
            size="sm"
            colorScheme={!selectedTeam ? "blue" : "gray"}
            variant={!selectedTeam ? "solid" : "outline"}
            onClick={() => setSelectedTeam(null)}
          >
            全て
          </Button>
          {teams.map(team => (
            <Button
              key={team}
              size="sm"
              colorScheme={selectedTeam === team ? "blue" : "gray"}
              onClick={() => setSelectedTeam(team === selectedTeam ? null : team)}
            >
              {team}
            </Button>
          ))}
        </Flex>

        {/* ステータスフィルター - ティアスタイル */}
        <Flex wrap="wrap" gap={2}>
          <Text fontWeight="bold" mr={4} alignSelf="center">ステータス:</Text>
          <Button
            size="sm"
            colorScheme={!selectedStatus ? "green" : "gray"}
            onClick={() => setSelectedStatus(null)}
          >
            全て
          </Button>
          {["出勤", "退勤", "欠勤", "公休"].map(status => (
            <Button
              key={status}
              size="sm"
              colorScheme={selectedStatus === status ? "green" : "gray"}
              onClick={() => setSelectedStatus(status === selectedStatus ? null : status)}
            >
              {status}
            </Button>
          ))}
        </Flex>
      </Box>

        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="cyan.400" />
            <Text mt={4} color="gray.400">データを読み込み中...</Text>
          </Box>
        ) : error ? (
          <Box textAlign="center" py={10} color="red.400">
            <Text>{error}</Text>
          </Box>
        ) : displayData.length === 0 ? (
          <Box textAlign="center" py={10} color="gray.400">
            <Text>表示するデータがありません。</Text>
          </Box>
        ) : (
          <Box
            overflowX="auto"
            borderWidth="1px"
            borderRadius="lg"
            borderColor="rgba(255,255,255,0.1)"
            boxShadow="0 4px 6px rgba(0,0,0,0.3)"
          >
            <Table variant="unstyled" size="sm">
              <Thead bg="#232323">
                <Tr>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("timestamp")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      日時
                      {sortField === "timestamp" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("name")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      氏名
                      {sortField === "name" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("branch")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      支店
                      {sortField === "branch" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("team")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      班
                      {sortField === "team" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("status_primary")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      状態
                      {sortField === "status_primary" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("status_secondary")}
                    _hover={{ bg: "rgba(255,255,255,0.05)" }}
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    <Flex align="center">
                      詳細
                      {sortField === "status_secondary" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    color="gray.300"
                    fontSize="xs"
                    py={2}
                    px={3}
                    borderBottom="1px solid rgba(255,255,255,0.05)"
                  >
                    場所
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayData.map((item, index) => (
                  <Tr
                    key={item.id}
                    bg={index % 2 === 0 ? "#1A1A1A" : "#232323"}
                    _hover={{ bg: "#2A2A2A" }}
                  >
                    <Td
                      borderColor="transparent"
                      color="white"
                      py={1.5}
                      px={3}
                      fontSize="sm"
                    >
                      {formatTimestamp(item.timestamp)}
                    </Td>
                    <Td
                      borderColor="transparent"
                      color="white"
                      py={1.5}
                      px={3}
                      fontSize="sm"
                    >
                      {item.family_name} {item.name}
                    </Td>
                    <Td
                      borderColor="transparent"
                      py={1.5}
                      px={3}
                    >
                      <Flex align="center">
                        <BranchIcon branch={item.branch || "-"} />
                        <Text ml={2} color="white" fontSize="sm">{item.branch || "-"}</Text>
                      </Flex>
                    </Td>
                    <Td
                      borderColor="transparent"
                      color="white"
                      py={1.5}
                      px={3}
                      fontSize="sm"
                    >
                      {item.team || "-"}
                    </Td>
                    <Td
                      borderColor="transparent"
                      py={1.5}
                      px={3}
                    >
                      <Badge
                        colorScheme={getStatusColor(item.status_primary)}
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="sm"
                      >
                        {item.status_primary}
                      </Badge>
                    </Td>
                    <Td
                      borderColor="transparent"
                      color="gray.300"
                      py={1.5}
                      px={3}
                      fontSize="sm"
                    >
                      {item.status_secondary || "-"}
                    </Td>
                    <Td
                      borderColor="transparent"
                      color="gray.300"
                      py={1.5}
                      px={3}
                      fontSize="xs"
                    >
                      {item.location}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Text mt={3} fontSize="xs" color="gray.400">
          {displayData.length}件のデータを表示中（全{attendanceData.length}件）
        </Text>
      </Container>
    </Box>
  );
}
