import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, LogIn } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/roleDisplay';
import { hasDashboardAccess, hasPermission, PermissionKey } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  permission?: PermissionKey;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  permission,
}) => {
  const { user, loading, isAdmin, isSuperAdmin, login } = useAuth();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const location = useLocation();

  // Loading state
  if (loading) {
    return <LoadingSpinner message={isKorean ? '권한을 확인하는 중...' : 'Verifying permissions...'} />;
  }

  // If the user is not logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace state={{ from: location.pathname + location.search }} />;
  }

  const canAccessProtectedRoute = permission
    ? hasPermission(user.permissions, permission)
    : isAdmin || hasDashboardAccess(user.permissions);

  // If the user does not have any dashboard access permissions, show an insufficient-permissions page
  if (!canAccessProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              {isKorean ? '권한 부족' : 'Insufficient Permissions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-gray-600">
              <p className="mb-2">
                {isKorean ? '현재 계정에는 관리자 권한이 없습니다.' : 'The account you are using does not have administrator rights.'}
              </p>
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {isKorean ? '현재 계정' : 'Current account'}: {user.email}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isKorean ? '역할' : 'Role'}: {isKorean ? ({
                    super_admin: '최고 관리자',
                    owner: '소유자',
                    admin: '관리자',
                    editor: '편집자',
                    viewer: '조회자',
                    developer: '개발자',
                    approver: '승인자',
                    user: '일반 사용자',
                  }[user.role] || user.role) : getRoleDisplayName(user.role)}
                </div>
              </div>
              <p className="text-sm">
                {isKorean ? '관리자 권한이 있는 계정으로 로그인하세요.' : 'Please log in with an account that has administrator rights.'}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={() => login()} className="w-full" variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                {isKorean ? '계정 전환' : 'Switch account'}
              </Button>

              <Button
                onClick={() => window.history.back()}
                className="w-full"
                variant="ghost"
              >
                {isKorean ? '돌아가기' : 'Go back'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is an admin, render the child components
  return <>{children}</>;
};

export default ProtectedAdminRoute;
