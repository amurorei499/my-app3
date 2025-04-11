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
} from "@chakra-ui/react";
import { UserData } from "@/app/utils/userData";
import { BranchName, branches, getTeamsByBranch } from "@/app/utils/branchData";


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
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // ユーザーデータをフォームにセット
  useEffect(() => {
    if (user?.branch) {
      setAvailableTeams(getTeamsByBranch(user.branch as BranchName));
    }
  }, [user]);

  // 支店が変更されたら、利用可能な班のリストを更新
  useEffect(() => {
    if (formData.branch) {
      const validBranch = formData.branch as BranchName;
      setAvailableTeams(getTeamsByBranch(validBranch));

      if (formData.team && !getTeamsByBranch(validBranch).includes(formData.team)) {
        setFormData(prev => ({ ...prev, team: "" }));
      }
    } else {
      setAvailableTeams([]);
    }
  }, [formData.branch]);

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
    // 既存の保存処理コード
    // ...
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent
        borderRadius="xl"
        boxShadow="xl"
        bg="#1A1A1A"
        color="white"
      >
        <ModalHeader
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
          color="cyan.400"
        >
          ユーザー情報編集
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody py={6}>
          {user ? (
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">{user.email}</Text>

              <Divider borderColor="whiteAlpha.200" />

              <FormControl>
                <FormLabel color="gray.300">姓</FormLabel>
                <Input
                  name="family_name"
                  value={formData.family_name || ""}
                  onChange={handleChange}
                  bg="#2D2D2D"
                  border="none"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">名</FormLabel>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  bg="#2D2D2D"
                  border="none"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">支店</FormLabel>
                <Select
                  name="branch"
                  value={formData.branch || ""}
                  onChange={handleChange}
                  placeholder="支店を選択"
                  bg="#2D2D2D"
                  border="none"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isDisabled={!formData.branch}>
                <FormLabel color="gray.300">班</FormLabel>
                <Select
                  name="team"
                  value={formData.team || ""}
                  onChange={handleChange}
                  placeholder="班を選択"
                  bg="#2D2D2D"
                  border="none"
                >
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Divider borderColor="whiteAlpha.200" />

              <FormControl>
                <FormLabel color="gray.300">権限</FormLabel>
                <Select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  placeholder="権限を選択"
                  bg="#2D2D2D"
                  border="none"
                >
                  <option value="admin">管理者</option>
                  <option value="manager">マネージャー</option>
                  <option value="viewer">閲覧者</option>
                  <option value="">権限なし</option>
                </Select>
              </FormControl>
            </VStack>
          ) : (
            <Text>ユーザーデータが見つかりません</Text>
          )}
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="whiteAlpha.200">
          <Button variant="ghost" color="gray.300" mr={3} onClick={onClose}>
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
