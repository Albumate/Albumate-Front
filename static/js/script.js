const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const closeBtn = document.getElementById('closeBtn');

// 팝업 닫기
closeBtn.addEventListener('click', function () {
  popup.style.display = 'none';
});
window.addEventListener('click', function (event) {
  if (event.target === popup) {
    popup.style.display = 'none';
  }
});

// 버튼 클릭시 팝업 내용 변경
document.querySelectorAll('.popup-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const num = this.getAttribute('data-popup');
    let html = '';
    if (num === '1') {
      html = `
        <span id="closeBtn" class="close">&times;</span>
        <div class="popup-title">앨범 추가</div>
        <input type="text" class="popup-input" placeholder="앨범 이름을 입력하세요" />
        <br>
        <button class="popup-action-btn">추가하기</button>
      `;
    } else if (num === '2') {
      html = `
        <span id="closeBtn" class="close">&times;</span>
        <div class="popup-title">앨범 초대</div>
        <input type="text" class="popup-input" placeholder="이메일을 입력하세요" />
        <br>
        <button class="popup-action-btn">초대하기</button>
      `;
    } else if (num === '3') {
      html = `
    <span id="closeBtn" class="close">&times;</span>
    <img src="/static/img/trash_icon.png"
         alt="앨범 삭제 아이콘" class="popup-image" />
    <div class="popup-warning">앨범을 삭제하시겠습니까?</div>
    <button class="popup-action-btn popup-delete-btn">삭제하기</button>
  `;
    }


    popupContent.innerHTML = html;
    popup.style.display = 'block';

    // 새로 만들어진 close 버튼에 이벤트 다시 연결
    popupContent.querySelector('#closeBtn').onclick = () => {
      popup.style.display = 'none';
    };
  });
});


const popup1 = document.getElementById('popup1');
const popupContent1 = document.getElementById('popupContent1');
const photoAddBtn1 = document.getElementById('photo-add-btn1');
const closeBtn1 = document.getElementById('closeBtn1');

// 팝업 닫기
closeBtn1.addEventListener('click', function () {
  popup1.style.display = 'none';
});
window.addEventListener('click', function (event) {
  if (event.target === popup1) {
    popup1.style.display = 'none';
  }
});

// 사진추가 버튼 클릭시 팝업 내용 변경
photoAddBtn1.addEventListener('click', function () {
  // 첨부 이미지 경로는 사용자 업로드 이미지를 사용
  const sampleImgUrl = "/static/img/sample_photo.jpg";
  const html = `
    <span id="closeBtn1" class="close1">&times;</span>
    <div class="popup-title1">사진 추가</div>
    <img src="${sampleImgUrl}" alt="샘플 사진" class="popup-image1" />
    <button class="popup-file-btn1">사진 선택하기</button>
    <br>
    <button class="popup-action-btn1">추가하기</button>
  `;
  popupContent1.innerHTML = html;
  popup1.style.display = 'block';

  // 새로 생성된 close 버튼에 이벤트 다시 연결
  popupContent1.querySelector('#closeBtn1').onclick = () => {
    popup1.style.display = 'none';
  };
});
