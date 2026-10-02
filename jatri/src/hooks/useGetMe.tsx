'use client'

import { AppDispatch, RootState } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function useGetMe(enabled: boolean) {
  const dispatch = useDispatch<AppDispatch>()
  const { userData } = useSelector((state: RootState) => state.user)

  useEffect(() => {
    if (!enabled) return // ✅ SAFE
    if (userData) return // ✅ Already loaded in Redux, skip duplicate network call

    let cancelled = false

    const getMe = async () => {
      try {
        const result = await axios.get('/api/me')
        if (!cancelled) {
          dispatch(setUserData(result.data))
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Not authenticated yet - ignore and stay logged out.
          return
        }
        console.error('GET ME FAILED:', error)
      }
    }

    getMe()

    return () => {
      cancelled = true
    }
  }, [enabled, dispatch])
}

export default useGetMe