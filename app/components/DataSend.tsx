// /app/components/DataSend.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { UserData } from "../utils/userData";

type DataSendProps = {
  userData: UserData;
  status: string; // 主要カテゴリ
  secondaryStatus?: string; // 詳細カテゴリ
  reason?: string; // 欠勤・公休の理由
  onSuccess?: () => void;
  loading?: boolean;
  colorScheme?: string; // 追加: カラースキームプロパティ
};

const DataSend: React.FC<DataSendProps> = ({
  userData,
  status,
  secondaryStatus = "",
  reason = "",
  onSuccess,
  loading = false,
  colorScheme, // 新規追加: 外部からのカラースキーム指定
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(loading);
  const [location, setLocation] = useState<string>("[不明]");
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const toast = useToast();

  // コンポーネントマウント時に端末情報と位置情報を取得
  useEffect(() => {
    const getLocation = () => {
      return new Promise<string>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("位置情報サービスが利用できません"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve(`[${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E]`);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });
    };

    const initializeLocation = async () => {
      try {
        const location = await getLocation();
        setLocation(location);
      } catch (error) {
        console.error("位置情報取得エラー:", error);
        setLocation("[取得失敗]");
      }
    };

    initializeLocation();
  }, []);

  // データ送信処理
  const handleSubmit = async () => {
    // 位置情報チェックを追加
    if (location === "[取得失敗]" || location === "[不明]") {
      toast({
        title: "位置情報の取得に失敗しました",
        description: "位置情報の利用を許可してください",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

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

    // AbortControllerの作成
    const controller = new AbortController();

    try {
      // タイムスタンプをサーバー側で生成するため、クライアント側では送信しない
      const attendanceData = {
        email: userData.email,
        family_name: userData.family_name || "",
        name: userData.name || "",
        branch: userData.branch || "",
        team: userData.team || "",
        location: location,
        status_primary: status,
        status_secondary: secondaryStatus || "",
        reason: reason || "",
        device: deviceInfo || "",
      };

      // APIエンドポイントにデータを送信（signal付き）
      const response = await fetch('/api/records/attendanceCreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData),
        signal: controller.signal // AbortController.signalを追加
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
    // 外部から指定されたcolorSchemeがあればそれを優先
    if (colorScheme) return colorScheme;

    // なければstatusに基づいて決定（画像に合わせて修正）
    switch (status) {
      case '出勤': return 'blue';  // 青色（1枚目の画像参照）
      case '退勤': return 'green'; // 緑色（1枚目の画像参照）
      case '欠勤': return 'red';   // 赤色（1枚目の画像参照）
      case '公休': return 'purple'; // 紫色（1枚目の画像参照）
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
      size="lg"
      width="100%"
      borderRadius="md"
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
      transition="all 0.2s"
    >
      {status}送信
    </Button>
  );
};

export default DataSend;
