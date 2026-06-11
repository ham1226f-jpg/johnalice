'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { UsersList } from '@/components/users/UsersList'
import { ReceiptSettings } from '@/components/reports/ReceiptSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Settings } from 'lucide-react'

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Users & Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage users and system settings
            </p>
          </div>

          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 gap-2 h-auto p-1">
              <TabsTrigger value="users" className="flex items-center gap-2 py-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" data-tour="users-container">
              <UsersList />
            </TabsContent>

            <TabsContent value="settings">
              <ReceiptSettings />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
