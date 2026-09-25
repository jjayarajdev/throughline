import CandidateHistoryView from '@/components/candidate/CandidateHistoryView'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import React from 'react'

export default function page() {
  return (
    <div className='p-4'>
    <Breadcrumbs />
    <CandidateHistoryView/>
    </div>
  )
}
