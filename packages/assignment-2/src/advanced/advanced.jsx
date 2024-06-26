import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { deepEquals } from "../basic/basic";

// 즉시 실행 함수의 사용이유
// 캐시 변수의 범위 제한 : 외부 접근 제한, 무결성 유지, 충돌 방지
// 초기화 로직 분리 :변수 한번만 초기화 가능, 캐싱 매커니즘을 구현하는데 필수적
// 클로저를 활용한 상태 유지 : cache 변수 외부 노출 안되고 상태 저장 가능
export const memo1 = (() => {
  let cache;

  return (fn) => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
})();

// 여러 인자 캐싱 처리
export const memo2 = (() => {
  const cache = new Map();

  return (fn, args) => {
    // 문자열로 반환, |f로 구분 하나의 키로 사용
    const key = args.map((arg) => JSON.stringify(arg)).join("|");

    // 캐시에 키가 이미 존재하면 결과 반환
    if (cache.has(key)) {
      return cache.get(key);
    }

    // 캐시에 키가 없다면, fn 호출 결과 캐시에 저장 후 반환
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
})();

export const useCustomState = (initValue) => {
  const [value, setValue] = useState(initValue);

  // 객체가 깊은 비교를 했을때 다르다면 변경
  const setDeepEqualsState = (state) => {
    if (!deepEquals(value, state)) {
      setValue(state);
    }
  };

  return [value, setDeepEqualsState];
};

const textContextDefaultValue = {
  user: null,
  todoItems: [],
  count: 0,
};

export const TestContext = createContext({
  value: textContextDefaultValue,
  setValue: () => null,
});

export const TestContextProvider = ({ children }) => {
  // ref를 사용하여 상태 업데이트가 컴포넌트를 리랜더링 하지 않도록 변경
  // setValue 또한 useCallback을 사용하여 ref가 바뀌지 않으면 리랜더링 하지 않도록 방지
  const ref = useRef(textContextDefaultValue);
  const setValue = useCallback(
    (key, value) => {
      ref.current = { ...ref.current, [key]: value };
    },
    [ref]
  );

  return (
    <TestContext.Provider value={{ value: ref.current, setValue }}>
      {children}
    </TestContext.Provider>
  );
};

// key값으로 특정 상태 지정
const useTestContext = (key) => {
  const { value, setValue } = useContext(TestContext);
  // 초기 상태 설정
  const [state, setState] = useState(value[key]);

  // 상태가 변경될 때마다 컨텍스트 값 업데이트
  useEffect(() => {
    setValue(key, state);
  }, [state]);

  return [state, setState];
};

//textContextDefaultValue 맞춘 키값
export const useUser = () => {
  return useTestContext("user");
};

export const useCounter = () => {
  return useTestContext("count");
};

export const useTodoItems = () => {
  return useTestContext("todoItems");
};
