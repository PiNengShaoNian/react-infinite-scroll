import React, { memo, useCallback, useReducer } from 'react'
import InfiniteScroll from './InfiniteScroll'

const allData = Array.from({ length: 30 }, (_, i) => {
  return {
    key: i,
    value: `${i}---${Math.random().toString(32).slice(2)}`,
  }
})

const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const startDelay = (ms) => {
  const time = new Date().getTime()

  return [
    delay,
    () => {
      const curTime = new Date().getTime()
      const gap = curTime - time
      return gap > ms ? 0 : ms - gap
    },
  ]
}

const ScrollItem = memo(({ item }) => {
  return (
    <div key={item.key} style={styles.item}>
      {item.value}
    </div>
  )
})

const initData = {
  more: true,
  data: [],
  after: 0,
}
const fetchActionTypes = {
  LOADED: 'LOADED',
  REFRESH: 'REFRESH',
}
const perPage = 10
const fetchReducer = (state, action) => {
  switch (action.type) {
    case fetchActionTypes.LOADED:
      return {
        ...state,
        data: state.data.concat(action.newData),
        more: action.newData.length === perPage,
        after: state.after + action.newData.length,
      }
    case fetchActionTypes.REFRESH:
      return {
        more: true,
        data: [],
        after: 0,
      }
    default:
      return state
  }
}

export default function App() {
  const onRefresh = useCallback(async () => {
    const [delay, getMs] = startDelay(3000)
    dispatch({
      type: fetchActionTypes.REFRESH,
    })
    await delay(getMs())
  }, [])

  const [state, dispatch] = useReducer(fetchReducer, initData)
  const { more, data, after } = state

  const onEndReached = useCallback(async () => {
    if (!more) return
    const [delay, getMs] = startDelay(3000)
    await delay(getMs())
    dispatch({
      type: fetchActionTypes.LOADED,
      newData: allData.slice(after, after + perPage),
    })
  }, [more, after])

  return (
    <div className="App">
      <div style={styles.container}>
        <InfiniteScroll
          data={data}
          onEndReached={onEndReached}
          more={more}
          onRefresh={onRefresh}
          renderItem={ScrollItem}
        />
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: 300,
    height: 400,
    background: 'red',
  },
  item: {
    height: 40,
    marginBottom: 10,
    background: 'lightblue',
  },
}
