// ProfileForm.js
import React, { useState } from 'react';
import axios from 'axios';

function ProfileForm({ onProfileCreated }) {
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: 'M', // 기본값 남성
    bio: '',
    interests: '',
    // 🔑 [추가] 거주지역
    location: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ProfileForm.js (수정된 handleSubmit 부분)
  const handleSubmit = async (e) => {
    e.preventDefault();
    // 1. 저장된 Access Token을 가져옵니다. (로그인 후 저장되었다고 가정)
    const accessToken = localStorage.getItem('accessToken');
    // 2. 토큰이 없으면 등록을 시도하지 않습니다.
    if (!accessToken) {
      alert("로그인이 필요합니다. 먼저 로그인해 주세요.");
      return;
    }
    try {
      // 3. 올바른 URL과 인증 헤더를 설정합니다.
      const url = 'http://127.0.0.1:8000/api/users/userprofile/';
      const response = await axios.post(url, formData, {
        headers: {
          // Bearer 스키마를 사용하여 Access Token을 보냅니다.
          'Authorization': `Bearer ${accessToken}`
        }
      });

      alert(`${response.data.nickname}님의 프로필이 생성되었습니다!`);
      onProfileCreated(response.data);
    } catch (error) {
      console.error("프로필 생성 실패:", error.response?.data || error);
      // 401 오류 시 로그인 만료 메시지 등을 보여줄 수 있습니다.
      if (error.response?.status === 401) {
        alert("로그인 세션이 만료되었거나 인증되지 않았습니다. 다시 로그인해주세요.");
      } else {
        const firstError =
          error.response && error.response.data
            ? Object.values(error.response.data)[0]
            : "알 수 없는 오류";
        alert(`프로필 생성 실패: ${firstError}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', border: '1px solid #ccc' }}>
      <h2>내 프로필 등록</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="nickname"
          type="text"
          placeholder="닉네임"
          onChange={handleChange}
          required
        /><br/>
        <input
          name="age"
          type="number"
          placeholder="나이"
          onChange={handleChange}
          required
        /><br/>
        <select
          name="gender"
          onChange={handleChange}
          value={formData.gender}
        >
          <option value="M">남성</option>
          <option value="F">여성</option>
        </select><br/>
        <textarea
          name="bio"
          placeholder="자기소개"
          onChange={handleChange}
        ></textarea><br/>
        <input
          name="interests"
          type="text"
          placeholder="관심사 (예: 독서,여행)"
          onChange={handleChange}
        /><br/>
        {/* 🔑 [추가] 거주지역 입력 */}
        <input
          name="location"
          type="text"
          placeholder="거주 지역 (예: 서울)"
          onChange={handleChange}
        /><br/>
        <button type="submit">프로필 생성</button>
      </form>
    </div>
  );
}

export default ProfileForm;
