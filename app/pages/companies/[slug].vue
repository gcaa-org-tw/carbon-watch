<script setup lang="ts">
import type { CompanyData } from '~/types/company'
import companyList from '~/assets/data/company-list.json'

const route = useRoute()
const companyName = computed(() => route.params.slug as string)

// Load raw data
const companies = companyList as CompanyData[]
const company = companies.find(c => c.公司 === companyName.value)

// Handle 404
if (!company) {
  throw createError({
    statusCode: 404,
    statusMessage: '找不到該企業',
    message: `企業 ${companyName.value} 不存在`,
  })
}

// SEO
useSeoMeta({
  title: `${company.公司} - 碳排放資訊 | 碳排大戶觀測站`,
  description: `查看 ${company.公司} 的溫室氣體排放量、淨零目標與減量策略`
})
</script>

<template>
  <div class="py-8">
    <ContentContainer>
      <CompanyOverviewSection
        :company="company"
        :all-companies="companies"
      />
    </ContentContainer>
  </div>
</template>
