import React from 'react'
import {Bar} from 'react-chartjs-2'
import {Chart as ChartJs} from 'chart.js/auto'

const BarChart = ({lineData,options}) => {
  return <Bar data={lineData} options={options}/>
}

export default BarChart