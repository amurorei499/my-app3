// /app/components/DataSend.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { AttendanceData } from "../utils/attendanceData";
import { UserData } from "../utils/userData";

type DataSendProps = {
  userData: UserData;
  status: string; // 主要カテゴリ
  secondaryStatus?: string; // 詳細カテゴリ
  reason?: string; // 欠勤・公休の理由
  onSuccess?: () => void;
  loading?: boolean;
};

const DataSend: React.FC<DataSendProps> = ({
  userData,
  status,
  secondaryStatus = "",
  reason = "",
  onSuccess,
  loading = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(loading);
  const [location, setLocation] = useState<string>("[不明]");
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const toast = useToast();

  // コンポーネントマウント時に端末情報と位置情報を取得
  useEffect(() => {
    // ユーザーエージェントから端末情報を取得
    const userAgent = navigator.userAgent;
    setDeviceInfo(userAgent);

    // 位置情報を取得（許可された場合）
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`[${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E]`);
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
        }
      );
    }
  }, []);

  // データ送信処理
  const handleSubmit = async () => {
    if (!userData || !userData.email) {
      toast({
        title: "エラー",
        description: "ユーザー情報が不足しています",
        status: "error",
        position: "top",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // 現在のタイムスタンプを生成
      const now = new Date();
      const timestamp = now.toISOString();

      // 送信するデータを構築
      const attendanceData: Omit<AttendanceData, 'timestamp'> = {
        email: userData.email,
        family_name: userData.family_name || "",
        name: userData.name || "",
        location,
        status_primary: status,
        status_secondary: secondaryStatus,
        reason,
        device: deviceInfo,
      };
      // timestampフィールドを送信しない
      await fetch('/api/records/attendanceCreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData), // timestampを含まない
      });

      // APIエンドポイントにデータを送信
      const response = await fetch('/api/records/attendanceCreate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "送信成功",
        description: `${status}${secondaryStatus ? `（${secondaryStatus}）` : ''}が記録されました`,
        status: "success",
        position: "top",
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("データ送信エラー:", error);
      toast({
        title: "送信エラー",
        description: error.message || "勤怠データの送信に失敗しました",
        status: "error",
        position: "top",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ボタンのカラースキーム
  const getColorScheme = () => {
    switch (status) {
      case '出勤': return 'teal';
      case '退勤': return 'cyan';
      case '欠勤': return 'orange';
      case '公休': return 'purple';
      default: return 'blue';
    }
  };

  return (
    <Button
      colorScheme={getColorScheme()}
      onClick={handleSubmit}
      isLoading={isLoading}
      loadingText="送信中"
      spinnerPlacement="start"
      size="md"
      borderRadius="md"
      boxShadow="sm"
      _hover={{ boxShadow: 'md' }}
    >
      {status}送信
    </Button>
  );
};


export default DataSend;