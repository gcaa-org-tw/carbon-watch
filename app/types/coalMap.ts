export interface CoalYearPoint {
  year: number
  value: number
}

export interface CoalMapFactory {
  管制編號: string
  廠名: string
  公司全名: string
  事業統編: string
  公司簡稱: string
  業別: string
  縣市: string
  經度: number
  緯度: number
  座標來源: string
  用煤量2024: number
  歷年用煤: CoalYearPoint[]
}

export interface CoalMapMeta {
  資料年份: number
  廠數: number
  公司數: number
  用煤量2024合計: number
  業別排序: string[]
}

export interface CoalMapData {
  meta: CoalMapMeta
  factories: CoalMapFactory[]
}
