import { EventManager, ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import { OrbitControls as OrbitControlsImpl } from '@deltadevs/three-stdlib'
import { forwardRef, useEffect, useMemo } from 'react'
import type { Camera, Event } from 'three'

export type OrbitControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
    {
      camera?: Camera
      domElement?: HTMLElement
      enableDamping?: boolean
      makeDefault?: boolean
      onChange?: (e?: Event) => void
      onEnd?: (e?: Event) => void
      onStart?: (e?: Event) => void
      regress?: boolean
      target?: ReactThreeFiber.Vector3
    }
  >,
  'ref'
>

export const OrbitControls = forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ makeDefault, camera, regress, domElement, enableDamping = true, onChange, onStart, onEnd, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const events = useThree(({ events }) => events) as EventManager<HTMLElement>
    const set = useThree(({ set }) => set)
    const get = useThree(({ get }) => get)
    const performance = useThree(({ performance }) => performance)
    const explCamera = camera || defaultCamera
    const explDomElement = domElement || (typeof events.connected !== 'boolean' ? events.connected : gl.domElement)
    const controls = useMemo(() => new OrbitControlsImpl(explCamera, explDomElement), [explCamera, explDomElement])

    useFrame(() => {
      if (controls.enabled) controls.update()
    })

    useEffect(() => {
      const callback = (e: Event) => {
        invalidate()
        if (regress) performance.regress()
        if (onChange) onChange(e)
      }

      controls.connect(explDomElement)
      controls.addEventListener('change', callback)

      if (onStart) controls.addEventListener('start', onStart)
      if (onEnd) controls.addEventListener('end', onEnd)

      return () => {
        controls.removeEventListener('change', callback)
        if (onStart) controls.removeEventListener('start', onStart)
        if (onEnd) controls.removeEventListener('end', onEnd)
        controls.dispose()
      }
    }, [explDomElement, onChange, onStart, onEnd, regress, controls, invalidate])

    useEffect(() => {
      Object.assign(controls, restProps)
    }, [restProps])

    useEffect(() => {
      if (makeDefault) {
        // @ts-expect-error new in @react-three/fiber@7.0.5
        const old = get().controls
        // @ts-expect-error new in @react-three/fiber@7.0.5
        set({ controls })
        // @ts-expect-error new in @react-three/fiber@7.0.5
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return <primitive ref={ref} object={controls} enableDamping={enableDamping} {...restProps} />
  }
)
