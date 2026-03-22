'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('確認メールを送りました。メールを確認してください。')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        router.push('/vision')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">塾スタートアップ</h1>
          <p className="text-sm text-gray-500 mt-1">チームダッシュボード</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === 'login' ? 'サインイン' : 'アカウント作成'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login'
                ? 'チームのダッシュボードにアクセス'
                : '新しいアカウントを作成してチームに参加'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">お名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-sm text-green-600">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'サインイン' : 'アカウントを作成'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-500">
              {mode === 'login' ? (
                <>
                  アカウントをお持ちでない方は{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    新規登録
                  </button>
                </>
              ) : (
                <>
                  すでにアカウントをお持ちの方は{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    サインイン
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
