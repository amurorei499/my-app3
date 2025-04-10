// /app/components/UserEditModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
  Text,
  Divider,
  useToast,
  Switch,
  FormHelperText,
  Badge,
} from "@chakra-ui/react";
import { UserData } from "@/app/utils/userData";

type UserRole = "admin" | "manager" | "viewer" | "";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdated: () => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [branches, setBranches] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // 支店・班データの取得（実際のアプリケーションではAPIから取得）
  useEffect(() => {
    // サンプルデータ
    setBranches(["東京", "大阪", "名古屋"]);
    setTeams(["営業部", "開発部", "人事部", "総務部"]);
  }, []);

  // ユーザーデータをフォームにセット
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
      });
      setSelectedRole(user.role as UserRole || "");
    }
  }, [user, isOpen]);

  // フォームの変更を処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 権限の変更を処理
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as UserRole);
  };

  // ユーザー情報の保存
  const handleSave = async () => {
    if (!user || !user.id) return;

    setSaving(true);
    try {
      // 更新データの準備
      const updateData = {
        ...formData,
        role: selectedRole,
      };

      // バックエンドAPIを呼び出してユーザー情報を更新
      const response = await fetch(`/api/admin/updateUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          userData: updateData,
          setCustomClaims: true, // カスタムクレームも更新
        }),
      });

      if (!response.ok) {
        throw new Error("ユーザー情報の更新に失敗しました");
      }

      // 成功時の処理
      onUserUpdated();
    } catch (error) {
      console.error("ユーザー更新エラー:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ユーザー情報の更新に失敗しました",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>ユーザー情報編集</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {user ? (
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">{user.email}</Text>

              <Divider />

              <FormControl>
                <FormLabel>姓</FormLabel>
                <Input
                  name="family_name"
                  value={formData.family_name || ""}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>名</FormLabel>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>支店</FormLabel>
                <Select
                  name="branch"
                  value={formData.branch || ""}
                  onChange={handleChange}
                  placeholder="支店を選択"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>班</FormLabel>
                <Select
                  name="team"
                  value={formData.team || ""}
                  onChange={handleChange}
                  placeholder="班を選択"
                >
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              <FormControl>
                <FormLabel>権限</FormLabel>
                <Select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  placeholder="権限を選択"
                >
                  <option value="admin">管理者</option>
                  <option value="manager">マネージャー</option>
                  <option value="viewer">閲覧者</option>
                  <option value="">権限なし</option>
                </Select>
                <FormHelperText>
                  管理者: すべての操作が可能
                </FormHelperText>
                <FormHelperText>
                  マネージャー: データ閲覧・編集が可能
                </FormHelperText>
                <FormHelperText>
                  閲覧者: データ閲覧のみ可能
                </FormHelperText>
              </FormControl>
            </VStack>
          ) : (
            <Text>ユーザーデータが見つかりません</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={!user}
          >
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
