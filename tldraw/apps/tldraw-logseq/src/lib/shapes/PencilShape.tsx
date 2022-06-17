/* eslint-disable @typescript-eslint/no-explicit-any */
import { SvgPathUtils, TLDrawShape, TLDrawShapeProps } from '@tldraw/core'
import { SVGContainer, TLComponentProps } from '@tldraw/react'
import { computed, makeObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import getStroke from 'perfect-freehand'
import { CustomStyleProps, withClampedStyles } from './style-props'

export interface PencilShapeProps extends TLDrawShapeProps, CustomStyleProps {
  type: 'pencil'
}

export class PencilShape extends TLDrawShape<PencilShapeProps> {
  constructor(props = {} as Partial<PencilShapeProps>) {
    super(props)
    makeObservable(this)
  }

  static id = 'pencil'

  static defaultProps: PencilShapeProps = {
    id: 'pencil',
    parentId: 'page',
    type: 'pencil',
    point: [0, 0],
    points: [],
    isComplete: false,
    stroke: '#000000',
    fill: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
  }

  @computed get pointsPath() {
    const {
      props: { points, isComplete, strokeWidth },
    } = this
    if (points.length < 2) {
      return `M -4, 0
      a 4,4 0 1,0 8,0
      a 4,4 0 1,0 -8,0`
    }
    const stroke = getStroke(points, { size: 4 + strokeWidth * 2, last: isComplete })
    return SvgPathUtils.getCurvedPathForPolygon(stroke)
  }

  ReactComponent = observer(({ events, isErasing }: TLComponentProps) => {
    const {
      props: { opacity },
    } = this
    return (
      <SVGContainer {...events} opacity={isErasing ? 0.2 : opacity}>
        {this.getShapeSVGJsx()}
      </SVGContainer>
    )
  })

  ReactIndicator = observer(() => {
    const { pointsPath } = this
    return <path d={pointsPath} />
  })

  validateProps = (props: Partial<PencilShapeProps>) => {
    props = withClampedStyles(props)
    if (props.strokeWidth !== undefined) props.strokeWidth = Math.max(props.strokeWidth, 1)
    return props
  }

  getShapeSVGJsx() {
    const {
      pointsPath,
      props: { stroke, strokeWidth },
    } = this
    return (
      <path
        d={pointsPath}
        strokeWidth={strokeWidth}
        stroke={stroke}
        fill={stroke}
        pointerEvents="all"
      />
    )
  }
}