<template>
  <!-- Report Table -->
  <div>
    <q-table flat square :rows="rows" :columns="columns" bordered virtual-scroll :rows-per-page-options="[15, 25, 0]"
      row-key="id" class="sticky-header-table" :loading="loadingReportRows" :filter="filter">
      <!-- Search -->
      <template v-slot:top-right>
        <q-input dense debounce="300" v-model="filter" placeholder="Search" input-class="search-options">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <!--/ End Search-->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn disable size="sm" icon="delete" color="negative" flat round dense @click="removerLinha(props.row)" />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { onMounted, ref, defineEmits } from 'vue'
import { getSingleReportById } from 'src/boot/reports'
import { useRoute } from 'vue-router'

const route = useRoute()
const reportName = ref('')
const reportMonth = ref('')

const columns = ref([])
const rows = ref([])

const filter = ref('')
const loadingReportRows = ref(false)

const emit = defineEmits(['reportDataToParent'])

const removerLinha = (row) => {
  rows.value = rows.value.filter((r) => r.id !== row.id)
}

onMounted(async () => {
  const id = route.params.id
  getSingleReportById(id)
    .then((response) => {
      //Atribute the response to the variables
      reportName.value = response.report.reportName
      reportMonth.value = response.report.reportMonth

      //Columns and Rows
      // columns.value = response.report.fileColumns || []
      columns.value = (response.report.fileColumns || []).map((col) => ({
        align: 'left',
        ...col,
      }))
      rows.value = response.report.fileRows || []

      // Emit the report name to the parent component
      const payload = {
        name: reportName.value,
        month: reportMonth.value,
      }
      emit('reportDataToParent', payload)
    })
    .catch((error) => {
      console.error(error)
    })
})
</script>
<style lang="sass">
.search-options
  width: 300px !important;
  max-width: 100% !important;
  min-width: 200px !important;
  color: #fff !important;
  &::placeholder
    color: #fff !important
    opacity: 1 !important

.sticky-header-table
  .q-table__top,
  thead tr:first-child th /* bg color is important for th; just specify one */
    background-color: #008080
    color: #ffffff

  thead tr th
    position: sticky
    z-index: 1
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 30px
  thead tr:first-child th
    top: 0

  q-table thead tr,
  .q-table tbody td
    height: 30px;
</style>
