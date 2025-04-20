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
import AdminLayout from "@/app/components/layouts/AdminLayout";

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
  const bgColor = useColorModeValue("gray.50", "gray.100");
  const borderColor = useColorModeValue("gray.200", "white");

  // マスターデータ取得
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const attendanceRef = collection(db, "attendance");
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
      const attendanceRef = collection(db, "attendance");
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

      const data: AttendanceData[] = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          family_name: docData.family_name || "", // 姓が無い場合は空文字を設定
          name: docData.name || "" // 名が無い場合は空文字を設定
        };
      }) as AttendanceData[];

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
      case "出勤": return "blue";
      case "退勤": return "green";
      case "欠勤": return "red";
      case "公休": return "purple";
      default: return "gray";
    }
  };

  // 認証状態の色設定
  const getAuthStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'attention': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <AdminLayout>
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

       {/* フィルターセクション */}
        <Box
          mb={4}
          p={3}
          borderRadius="md"
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="sm"
        >
        {/* 支店フィルター */}
        <Flex wrap="wrap" gap={2} mb={4}>
          <Text fontWeight="bold" mr={4} alignSelf="center" color="gray.700">支店:</Text>
          <Button
            size="sm"
            colorScheme={!selectedBranch ? "blue" : "gray"}
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
              colorScheme={selectedBranch === branch ? "blue" : "gray"}
              onClick={() => setSelectedBranch(branch === selectedBranch ? null : branch)}
            >
              {branch}
            </Button>
          ))}
        </Flex>

        {/* 班フィルター */}
        <Flex wrap="wrap" gap={2} mb={4}>
          <Text fontWeight="bold" mr={4} alignSelf="center" color="gray.700">班:</Text>
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

        {/* ステータスフィルター */}
        <Flex wrap="wrap" gap={2}>
          <Text fontWeight="bold" mr={4} alignSelf="center" color="gray.700">ステータス:</Text>
          <Button
            size="sm"
            colorScheme={!selectedStatus ? "blue" : "gray"}
            onClick={() => setSelectedStatus(null)}
          >
            全て
          </Button>
          {["出勤", "退勤", "欠勤", "公休"].map(status => (
            <Button
              key={status}
              size="sm"
              colorScheme={selectedStatus === status ? "blue" : "gray"}
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
            borderColor="gray.200"
            boxShadow="sm"
            bg="white"
            sx={{
              // スマホでの横スクロール時の操作性向上
              WebkitOverflowScrolling: 'touch',
              // スクロールバーをカスタマイズ
              '&::-webkit-scrollbar': {
                height: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'gray.100',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.300',
                borderRadius: '3px',
              }
            }}
          >
            <Table variant="simple" size="sm">
              <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th
                    cursor="pointer"
                    onClick={() => handleSort("timestamp")}
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
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
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
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
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
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
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
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
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
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
                    _hover={{ bg: "gray.100" }}
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
                  >
                    <Flex align="center">
                      詳細
                      {sortField === "status_secondary" && (
                        sortDirection === "asc" ? <ChevronUpIcon ml={1} /> : <ChevronDownIcon ml={1} />
                      )}
                    </Flex>
                  </Th>
                  <Th
                    color="gray.600"
                    fontSize={{ base: "2xs", md: "xs" }}
                    py={{ base: 1, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    whiteSpace="nowrap"
                  >
                    認証状態
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayData.map((item, index) => (
                  <Tr
                    key={item.id}
                    bg={index % 2 === 0 ? "gray.50" : "white"}
                    _hover={{ bg: "gray.100" }}
                  >
                    <Td
                      borderColor="gray.200"
                      color="gray.700"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                      fontSize={{ base: "2xs", md: "sm" }}
                      whiteSpace="nowrap"
                    >
                      {formatTimestamp(item.timestamp)}
                    </Td>
                    <Td
                      borderColor="gray.200"
                      color="gray.700"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                      fontSize={{ base: "2xs", md: "sm" }}
                      whiteSpace="nowrap"
                    >
                      {item.family_name} {item.name}
                    </Td>
                    <Td
                      borderColor="gray.200"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                    >
                      <Flex align="center">
                        <Box
                          w={{ base: "14px", md: "18px" }}
                          h={{ base: "14px", md: "18px" }}
                        >
                          <BranchIcon branch={item.branch || "-"} />
                        </Box>
                      </Flex>
                    </Td>
                    <Td
                      borderColor="gray.200"
                      color="gray.700"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                      fontSize={{ base: "2xs", md: "sm" }}
                      whiteSpace="nowrap"
                    >
                      {item.team || "-"}
                    </Td>
                    <Td
                      borderColor="gray.200"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                    >
                      <Badge
                        colorScheme={getStatusColor(item.status_primary)}
                        fontSize={{ base: "3xs", md: "xs" }}
                        px={{ base: 1, md: 2 }}
                        py={{ base: 0.25, md: 0.5 }}
                        borderRadius="sm"
                      >
                        {item.status_primary}
                      </Badge>
                    </Td>
                    <Td
                      borderColor="gray.200"
                      color="gray.600"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                      fontSize={{ base: "2xs", md: "sm" }}
                      whiteSpace="nowrap"
                    >
                      {item.status_secondary || "-"}
                    </Td>
                    <Td
                      borderColor="gray.200"
                      py={{ base: 0.5, md: 1.5 }}
                      px={{ base: 2, md: 3 }}
                    >
                      <Badge
                        colorScheme={getAuthStatusColor(item.location_auth)}
                        fontSize={{ base: "3xs", md: "xs" }}
                        px={{ base: 1, md: 2 }}
                        py={{ base: 0.25, md: 0.5 }}
                        borderRadius="sm"
                      >
                        {item.location_auth || "未確認"}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box mt={3}>
          <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.400">
            {displayData.length}件のデータを表示中（全{attendanceData.length}件）
          </Text>
          <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.400" mt={1}>
            ※ 横にスクロールすると、より多くの情報を確認できます
          </Text>
        </Box>
      </Container>
    </AdminLayout>
  );
}
