"use client";

import { Box } from "@chakra-ui/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box minH="100vh" bg="gray.900">
      {children}
    </Box>
  );
} 