import React from 'react'
import RefreshingSvgLoading from './RefreshingSvgLoading'
import RefreshingSvgPulling from './RefreshingSvgPulling'

const addEventListener = (node, eventName, handler, options) => {
  node.addEventListener(eventName, handler, options)

  return () => {
    node.removeEventListener(eventName, handler, options)
  }
}

export default class InfiniteScroll extends React.Component {
  state = {
    isDragging: false,
    refreshing: false,
    loading: false,
  }

  observer = new IntersectionObserver(
    async (entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        if (this.props.onEndReached) {
          this.setState({
            loading: true,
          })
          try {
            await this.props.onEndReached()
          } catch (err) {
            console.log(err)
          }
          this.setState({
            loading: false,
          })
        }
      }
    },
    { threshold: 1 }
  )

  setContainerNode = (node) => {
    this.containerNode = node
  }

  setRefreshNode = (node) => {
    this.refreshNode = node
  }

  setProbeNode = (node) => {
    this.probeNode = node
    const currentObserver = this.observer

    if (node) {
      currentObserver.observe(node)
    }
  }

  handleTouchStart = (event) => {
    if (this.containerNode.scrollTop !== 0) {
      if (this.state.refreshing) {
        this.setState({
          isDragging: false,
          refreshing: false,
        })
        this.canRefreshing = false
        this.setTransform(0)
      }
      return
    }

    const touch = event.touches[0]
    this.containerHeight = this.containerNode.getBoundingClientRect().height
    this.started = true

    this.startY = touch.pageY
  }

  handleTouchMove = (event) => {
    if (!this.started) this.handleTouchStart(event)

    const touch = event.touches[0]

    const delta = touch.pageY - this.startY
    if (delta <= 0) return (this.started = false)

    event.preventDefault()

    let translate =
      (Math.exp((delta / this.containerHeight / 2) * 0.5) - 1) *
      this.containerHeight

    if (translate >= 60) {
      translate = 60
      this.canRefreshing = true
    } else {
      this.canRefreshing = false
    }
    this.setTransform(translate, translate / 60)
    this.setState({
      isDragging: true,
    })
  }

  handleTouchEnd = async () => {
    if (this.props.onRefresh && this.canRefreshing) {
      try {
        this.setState({
          refreshing: true,
        })
        await this.props.onRefresh()
      } catch (err) {
        console.log(err)
      }
    }
    this.setState({
      isDragging: false,
      refreshing: false,
    })
    this.canRefreshing = false
    this.setTransform(0)
  }

  setTransform = (translate, percent) => {
    this.refreshNode.style.transform = `translate(0,${translate}px) rotate(${
      (translate / 60) * 360
    }deg)`
    this.refreshNode.children[0].style.opacity = percent
  }

  componentDidMount() {
    this.removeTouchMove = addEventListener(
      this.containerNode,
      'touchmove',
      this.handleTouchMove,
      {
        passive: false,
      }
    )
  }

  componentWillUnmount() {
    this.removeTouchMove()
    if (this.probeNode) {
      this.observer.unobserve(this.probeNode)
    }
  }

  render() {
    const { data, renderItem: Comp, more } = this.props
    const { isDragging, refreshing, loading } = this.state
    const touchEvents = {
      onTouchStart: this.handleTouchStart,
      onTouchEnd: this.handleTouchEnd,
    }

    let transition

    if (isDragging) {
      transition = 'all 0s ease 0s'
    } else {
      transition = 'transform .35s cubic-bezier(0.15, 0.3, 0.25, 1) 0s'
    }

    const refreshIndicatorStyle = Object.assign({}, styles.refreshIndicator, {
      transition,
    })

    return (
      <div style={styles.rootStyle}>
        <div
          ref={this.setContainerNode}
          {...touchEvents}
          style={styles.containerStyle}
        >
          <div style={refreshIndicatorStyle} ref={this.setRefreshNode}>
            {refreshing ? <RefreshingSvgLoading /> : <RefreshingSvgPulling />}
          </div>
          {data.map((item, index) => (
            <Comp item={item} index={index} key={item.key} />
          ))}
          {loading && !refreshing && <li>Loading...</li>}
          {!loading && more && (
            <li ref={this.setProbeNode} style={{ background: 'transparent' }} />
          )}
        </div>
      </div>
    )
  }
}

const styles = {
  rootStyle: {
    height: '100%',
    overflow: 'hidden',
  },
  containerStyle: {
    height: '100%',
    overflow: 'auto',
    position: 'relative',
  },
  refreshIndicator: {
    position: 'absolute',
    height: 16,
    width: 16,
    top: -30,
    left: '50%',
    marginLeft: -15,
    borderRadius: 15,
    background: '#fff',
    padding: 7,
    boxShadow: '2px 2px 4px #ccc, -2px -2px 4px #ccc',
  },
}
