import React, { Fragment, MouseEvent, useEffect, useState } from 'react'
import { Modal, Select } from '@/components'
import { formatInstrumentName } from '@/utils'
import { gmInstruments, InstrumentName } from '@/features/synth'
import { ArrowLeft, Midi } from '@/icons'
import { ButtonWithTooltip } from '../../PlaySong/components/TopBar'
import Link from 'next/link'
import midiState from '@/features/midi'
import { MidiStateEvent } from '@/types'

type TopBarProps = {
  isError: boolean
  isLoading: boolean
  value: InstrumentName
  onChange: (instrument: InstrumentName) => void
  onClickMidi: (e: MouseEvent<any>) => void
}

declare const Peer: any

export default function TopBar({ isError, isLoading, value, onChange, onClickMidi }: TopBarProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [peerId, setPeerId] = useState('')

  const [peer, setPeer] = useState(null)

  const listeners: any = [];

  function onLiveShare() {
    if (peer !== null) {
      setShowShareModal(true)
      return
    }

    const peerObj = new Peer()

    peerObj.on('connection', function (conn: any) {
      listeners.push(conn);
    })

    peerObj.on('open', function (id: string) {
      setPeerId(id)
      setShowShareModal(true)

      midiState.subscribe((e: MidiStateEvent) => {
        for(const listener of listeners) {
          if(listener) {
            listener.send(e);
          }
        }
      });
    })

    setPeer(peerObj)
  }

  function onCloseModal() {
    console.log('close')
    setShowShareModal(false)
  }

  useEffect(() => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)

    const liveId = urlParams.get('live')
    if (liveId) {
      const peerObj = new Peer()

      peerObj.on('open', function (id: string) {
        const conn = peerObj.connect(liveId)
        conn.on('open', function () {
          conn.on('data', function(data: any) {
            if(data.type === 'down') {
              midiState.press(data.note, data.velocity)
            } else if(data.type === 'up') {
              midiState.release(data.note)
            }
          });
        })
      })
    }
  }, [])

  return (
    <Fragment>
      <div className="px-4 text-white transition text-2xl h-[50px] min-h-[50px] w-full bg-[#292929] flex items-center gap-4">
        <div className="flex items-center justify-start gap-4">
          <ButtonWithTooltip tooltip="Back">
            <Link href="/">
              <ArrowLeft size={24} />
            </Link>
          </ButtonWithTooltip>

          <button
            onClick={onLiveShare}
            className=" flex items-center justify-center gap-2 bg-purple-primary text-white hover:bg-purple-hover text-sm rounded-full px-4 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>

            <span>Live Share</span>
          </button>
        </div>
        <ButtonWithTooltip tooltip="Choose a MIDI device" className="ml-auto" onClick={onClickMidi}>
          <Midi size={24} />
        </ButtonWithTooltip>
        <Select
          className="max-w-fit h-3/4 text-base text-black"
          loading={isLoading}
          error={isError}
          value={value}
          onChange={onChange}
          options={gmInstruments as any}
          format={formatInstrumentName as any}
          display={formatInstrumentName as any}
        />
      </div>
      <Modal show={showShareModal} onClose={onCloseModal}>
        <div className="p-6 flex flex-col gap-6">
          <h1 className="font-bold text-2xl text-black">Sharable Link</h1>
          <p className="text-gray-600">
            Share link below with your friend and they will hear you play.
          </p>

          {typeof window !== 'undefined' && (
            <a
              href={`${window.location.origin}/freeplay?live=${peerId}`}
              target="_blank"
              className="bg-gray-100 text-center text-black rounded-full px-6 py-2"
            >
              {`${window.location.origin}/freeplay?live=${peerId}`}
            </a>
          )}
        </div>
      </Modal>
    </Fragment>
  )
}
