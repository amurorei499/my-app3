// /app/components/RoleBasedAccess.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface RoleBasedAccessProps {
  children: ReactNode;
  requiredRole: string;
  fallback?: ReactNode;
}

export default function RoleBasedAccess({
  children,
  requiredRole,
  fallback = <Text color="red.500">このページにアクセスする権限がありません</Text>,
}: RoleBasedAccessProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // IDトークンを取得して権限を確認
          const idTokenResult = await user.getIdTokenResult();

          // カスタムクレームに基づいて権限チェック
          const hasRequiredRole = idTokenResult.claims[requiredRole] === true;
          setHasAccess(hasRequiredRole);
        } catch (error) {
          console.error("権限確認エラー:", error);
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, requiredRole]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>権限を確認中...</Text>
      </Box>
    );
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
