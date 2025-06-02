from flask import Flask, render_template, url_for

app = Flask(__name__)

# 더미 데이터 예시
albums = [
    {"id": 1, "name": "여행"},
    {"id": 2, "name": "가족"},
    {"id": 3, "name": "친구"},
    {"id": 4, "name": "친구"},
    {"id": 6, "name": "친구"},
    {"id": 7, "name": "친구"},
    {"id": 8, "name": "친구"},
    {"id": 9, "name": "친구"},
]


@app.route("/")
def home():
    return render_template("home.html", albums=albums)


@app.route("/album/<int:album_id>")
def album_detail(album_id):
    selected_album = next((a for a in albums if a["id"] == album_id), None)
    if not selected_album:
        return "앨범 없음", 404
    selected_album["photos"] = [
        {"id": 1, "filename": "photo1.jpg"},
        {"id": 2, "filename": "photo2.jpg"},
    ]
    return render_template("album_list.html", album=selected_album, albums=albums)


@app.route("/photo/<int:photo_id>")
def photo_detail(photo_id):
    photo = {
        "id": photo_id,
        "filename": "photo1.jpg",
        "album": albums[0],
        "timestamp": "2025-05-29 10:30",
    }
    return render_template("photo_list.html", photo=photo, albums=albums)


@app.route("/logout", methods=["POST"])
def logout():
    return "로그아웃 완료"


@app.route("/add", methods=["POST"])
def add_album():
    return "앨범 추가"


@app.route("/add", methods=["POST"])
def add_photo():
    return "사진 추가"

@app.route('/invite', endpoint='invite_user')
def some_func():
    pass


if __name__ == "__main__":
    app.run(debug=True)


