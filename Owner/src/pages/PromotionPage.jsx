import React from 'react'
import { FaLink, FaTiktok } from 'react-icons/fa'
import { FaFacebook, FaInstagram, FaTelegram, FaYoutube } from 'react-icons/fa6'

const PromotionPage = () => {
  return (
    <div style={{width:'100%',height:'500px',gap:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
      <h1>Promote your Company Product and Service With us</h1>
      <span>Check Our Platforms</span>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
      <a target='_blank' href='https://www.tiktok.com'><FaTiktok size={25} color='black'/></a>
      <a target='_blank' href='https://www.facebook.com'><FaFacebook size={25}/></a>
      <a target='_blank' href='https://www.telegram.com'><FaTelegram size={25} /></a>
      <a target='_blank' href='https://www.instagram.com'><FaInstagram size={25} /></a>
      <a target='_blank' href='https://www.youtube.com'><FaYoutube color='red' size={25} /></a>
      </div>
      <a target='_blank' href='https://www.securehrtech.com'><FaLink/>Our Website</a>

    </div>
  )
}

export default PromotionPage