'use client'

import { AppDispatch, RootState } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function useGetMe(enabled: boolean = true, forceRefresh: boolean = false) {
  const dispatch = useDispatch<AppDispatch>()
  const { userData } = useSelector((state: RootState) => state.user)

  const refetch = useCallback(async () => {
    try {
      const result = await axios.get('/api/me', {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      })
      if (result.data) {
        dispatch(setUserData(result.data))
      }
      return result.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        return null
      }
      console.error('GET ME FAILED:', error)
      return null
    }
  }, [dispatch])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const getMe = async () => {
      try {
        const result = await axios.get('/api/me', {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        })
        if (!cancelled && result.data) {
          dispatch(setUserData(result.data))
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          return
        }
        console.error('GET ME FAILED:', error)
      }
    }

    getMe()

    return () => {
      cancelled = true
    }
  }, [enabled, dispatch, forceRefresh])

  return { userData, refetch }
}

export default useGetMe