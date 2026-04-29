/**
 * @file useModal.ts
 * @description 모달 상태 관리를 위한 커스텀 훅
 * 
 * [개요]
 * 컴포넌트 내에서 자주 사용되는 모달의 열림/닫힘 상태 및 토글 로직을 재사용 가능하도록 추상화한 훅입니다.
 * 
 * [함수 호출 구조 및 활용]
 * 1. 컴포넌트 내에서 useModal() 호출 -> isOpen 상태 및 open, close, toggle 함수 획득
 * 2. 반환된 상태/함수를 UI 이벤트 바인딩 및 하위 모달 컴포넌트 Props로 주입
 */
import { useState, useCallback } from 'react';

/**
 * 모달 상태 관리 훅
 * @param initialState 모달의 초기 열림/닫힘 상태 (기본값: false)
 * @returns { isOpen, open, close, toggle }
 */

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  
  return { isOpen, open, close, toggle };
}
