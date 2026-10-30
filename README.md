# shrinking-busan

부산광역시 2026년 9월 행정동별 생활인구와 주민등록인구 비율 지도입니다.

## 실행

1. 필요한 패키지: pandas, geopandas, folium, python-dotenv, IPython.
2. 상위 작업 폴더의 .env에 V-WORLD_KEY를 설정합니다.
3. shrinking-busan.ipynb를 열어 셀을 실행합니다.
4. 셀은 data/의 CSV와 GeoJSON을 결합하고 preview_202609.html을 생성합니다.

## 비율 정의

생활인구는 행정동별 24개 시간대에서 주거·직장·방문인구 합계를 구한 뒤 24시간 평균을 계산합니다. 시간대별 값을 더하지 않아 하루 인구를 반복 집계하지 않습니다. 이 값을 2026년 9월 말 주민등록인구로 나눴습니다.

범주는 0.50 미만, 0.50–0.79, 0.80–0.99, 1.00–1.49, 1.50 이상입니다.

## 출처

- 생활인구: [공공데이터포털 부산광역시 OpenAPI](https://www.data.go.kr/data/15164444/openapi.do)
- 주민등록인구: [공공데이터포털 행정안전부 CSV](https://www.data.go.kr/data/3033254/fileData.do)
- 행정동 경계: 로컬 프로젝트의 HangJeongDong_ver20250101.geojson에서 부산 206개 동 추출
