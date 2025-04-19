"use client";

// app/components/layouts/AdminLayout.tsx

import { ReactNode, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Text,
  CloseButton,
  BoxProps,
  FlexProps,
  Drawer,
  DrawerContent,
  useDisclosure,
  Stack,
} from "@chakra-ui/react";
import {
  FiMenu,
  FiUsers,
  FiMap,
  FiDatabase,
  FiHome,
} from "react-icons/fi";
import { IconType } from "react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LinkItemProps {
  name: string;
  icon: IconType;
  href: string;
}

const LinkItems: Array<LinkItemProps> = [
  { name: "ダッシュボード", icon: FiHome, href: "/admin" },
  { name: "ユーザー管理", icon: FiUsers, href: "/admin/users" },
  { name: "支店管理", icon: FiMap, href: "/admin/branches" },
  { name: "データ確認", icon: FiDatabase, href: "/admin/viewdata" },
  { name: "勤怠管理", icon: FiHome, href: "/" },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* モバイルナビゲーション */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const pathname = usePathname();
  
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          管理画面
        </Text>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          href={link.href}
          isActive={pathname === link.href}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, href, isActive, ...rest }: NavItemProps) => {
  const isMainPage = href === "/";
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? "cyan.400" : "transparent"}
        color={isMainPage ? "red.400" : isActive ? "white" : "inherit"}
        _hover={{
          bg: isMainPage ? "red.400" : "cyan.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Box mr="4" color={isMainPage ? "red.400" : "inherit"}>
            {icon({
              size: 16,
            })}
          </Box>
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="メニューを開く"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: "flex", md: "none" }}
        fontSize="2xl"
        fontWeight="bold"
      >
        管理画面
      </Text>

      <Stack direction="row" spacing={4} align="center">
        {/* ここに必要に応じてヘッダーの追加要素を配置できます */}
      </Stack>
    </Flex>
  );
}; 