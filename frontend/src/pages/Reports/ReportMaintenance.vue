<template>
  <q-header elevated>
    <q-toolbar class="bg-black text-white">
      <q-toolbar-title>
        <span>
          {{ reportNameChild || 'Report Name' }}
          <q-popup-edit
            v-model="reportNameChild"
            auto-save
            v-slot="scope"
            v-if="isAdmin"
          >
            <q-input
              type="textarea"
              rows="3"
              v-model="scope.value"
              dense
              autofocus
              @keyup.enter="scope.set"
            />
          </q-popup-edit>
        </span>
        <em
          >({{ reportMonthChild.toString() || ' --- ' }})
          <q-popup-edit
            v-model="reportMonthChild"
            auto-save
            v-slot="scope"
            v-if="isAdmin"
          >
            <!-- <q-input type="textarea" rows="3" v-model="scope.value" dense autofocus @keyup.enter="scope.set" /> -->
            <q-select
              option-label="label"
              option-value="value"
              v-model="scope.value"
              :options="monthOptions"
              @keyup.enter="scope.set"
              multiple
              input-debounce="0"
              emit-value
            />
          </q-popup-edit>
        </em>
      </q-toolbar-title>
      <q-btn
        flat
        round
        dense
        icon="file_download"
        @click="exportToExcelOnChild"
      >
        <q-tooltip> Export File </q-tooltip>
      </q-btn>
      <!-- TODO: Enable this Feature to show the number of new modifications/Edited Rows -->
      <!-- <q-btn v-if="isAdmin" flat round dense icon="person">
        <q-badge floating color="red">2</q-badge>
        <q-tooltip> 2 new modifications </q-tooltip>
      </q-btn> -->
      <q-btn
        flat
        round
        dense
        icon="table_rows"
        class="q-mr-xs"
        @click="addNewRowOnChild"
        :disable="!isAdmin"
      >
        <q-tooltip> Add New Row </q-tooltip>
      </q-btn>

      <!-- Upload Update File -->
      <div>
        <!-- hidden q-file -->
        <q-file
          ref="fileInput"
          v-model="fileToUpload"
          :clearable="true"
          style="display: none"
          accept=".csv, .xlsx, .xls"
          @update:model-value="onFileChange"
        />
        <q-btn
          flat
          round
          dense
          icon="cloud_upload"
          @click="triggerFileInput"
          class="q-mr-xs"
        >
          <q-tooltip> Upload File </q-tooltip>
        </q-btn>
      </div>
      <!-- End Upload Update File -->

      <q-btn
        flat
        round
        dense
        icon="save"
        class="q-mr-xs"
        @click="saveUpdateReportOnChild"
        :disable="!isAdmin"
      >
        <q-tooltip> Update Report </q-tooltip>
      </q-btn>
      <q-btn flat round dense to="/reports" icon="arrow_back">
        <q-tooltip> Go back </q-tooltip>
      </q-btn>
    </q-toolbar>
  </q-header>

  <!-- Report Table -->
  <div class="q-pa-none">
    <q-card flat>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="secondary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
        no-caps
      >
        <q-tab name="tables" label="Table" />
        <q-tab name="summary" label="Summary" />
        <q-tab name="graphs" label="Graphics" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel class="q-pa-sm" name="tables">
          <div v-if="fileToUpload">
            <q-table
              class="q-mb-sm sticky-header-table updater-table"
              flat
              bordered
              square
              :rows="importedFileRows"
              :columns="importedFileColumns"
              row-key="id"
              :rows-per-page-options="[15, 25, 0]"
            >
              <template v-slot:top-right>
                <q-btn-group spread>
                  <q-btn
                    no-caps
                    dense
                    color="negative"
                    label="Clear"
                    @click="cancelUpdate"
                    class="q-px-md"
                  />
                </q-btn-group>
              </template>
              <!-- Table Rows -->
              <template #body-cell="props">
                <q-td :props="props" class="cell-with-tooltip">
                  <div class="cell-content">
                    {{ props.value }}
                    <q-tooltip anchor="center middle" self="top middle">
                      {{ props.value }}
                    </q-tooltip>
                  </div>
                </q-td>
              </template>
            </q-table>
          </div>
          <report-table
            v-if="isAdmin || isEditor"
            @report-data-to-parent="reportDataFromChild"
            @clear-update-report-data="clearUpdateReportDataFromChild"
            ref="reportTableRef"
          />
          <report-view v-else @report-name-to-parent="reportDataFromChild" />
        </q-tab-panel>

        <q-tab-panel name="summary">
          <report-summary />
        </q-tab-panel>

        <q-tab-panel name="graphs" class="q-pa-sm">
          <report-graphs />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ReportTable from 'src/components/Report/ReportTable.vue';
import ReportView from 'src/components/Report/ReportView.vue';
import ReportSummary from 'src/components/Report/ReportSummary.vue';
import ReportGraphs from 'src/components/Report/ReportGraphs.vue';
import Cookies from 'js-cookie';
import * as XLSX from 'xlsx';

const isElectron = ref(false);
const isAdmin = ref(false);
const isEditor = ref(false);
const isViewer = ref(false);
const isAuditor = ref(false);
const tab = ref('tables');
const reportTableRef = ref(null);

const reportNameChild = ref('');
const reportMonthChild = ref('');

const excelData = ref([]);
const importedFileRows = ref([]);
const importedFileColumns = ref([]);

// Upload Table by Uploading a File
const fileToUpload = ref(null);
const fileInput = ref(null);
const triggerFileInput = () => {
  fileInput.value.pickFiles();
};

const onFileChange = (newFile) => {
  if (!newFile) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    // Read first Sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    excelData.value = json;

    // Building Table Headers
    importedFileColumns.value = json[0].map((col, index) => ({
      // id: idCounter++,
      name: String(col).toLowerCase(),
      label: capitalize(col),
      field: String(col).toLowerCase(),
      align: 'left' || '',
    }));

    // Building Table Rows
    importedFileRows.value = excelData.value.slice(1).map((row, index) => {
      const rowData = {};
      importedFileColumns.value.forEach((col, colIndex) => {
        // If the value is empty, fill it with an empty string with dashes(" --- ")
        rowData[col.field] = row[colIndex] || ' --- '; // Replace empty cells with an empty string

        // If the column is 'status', set a default value of 'Open'
        if (col.name === 'status') {
          rowData[col.field] = rowData[col.field] || 'Open';
        }
      });
      return { id: index, ...rowData };
    });
  };

  reader.readAsArrayBuffer(newFile);
};

const reportDataFromChild = (payload) => {
  reportNameChild.value = payload.name;
  reportMonthChild.value = payload.month;
};

const addNewRowOnChild = () => {
  reportTableRef.value?.addNewRow();
};

const saveUpdateReportOnChild = () => {
  const payload = {
    name: reportNameChild.value,
    month: reportMonthChild.value,
    newColumns: importedFileColumns.value,
    newRows: importedFileRows.value,
  };
  reportTableRef.value?.saveUpdateReport(payload);
};

const exportToExcelOnChild = () => {
  reportTableRef.value?.exportToExcel();
};

const clearUpdateReportDataFromChild = () => {
  cancelUpdate();
}

const getCookie = async (name) => {
  if (isElectron.value) {
    return await window.electronAPI.getCookie(name);
  } else {
    return Cookies.get(name);
  }
};

const initializeCookieValues = async () => {
  isAdmin.value = (await getCookie('isAdmin')) === 'true';
  isAuditor.value = (await getCookie('isAuditor')) === 'true';
  isEditor.value = (await getCookie('isEditor')) === 'true';
  isViewer.value = (await getCookie('isViewer')) === 'true';
};

const cancelUpdate = () => {
  fileToUpload.value = null;
  importedFileRows.value = [];
  importedFileColumns.value = [];
};

//Utility function to capitalize the first letter of a string
const capitalize = (str) =>
  str && str[0].toUpperCase() + str.slice(1).toLowerCase();

const monthOptions = [
  {
    label: 'January',
    value: 'January',
  },
  {
    label: 'February',
    value: 'February',
  },
  {
    label: 'March',
    value: 'March',
  },
  {
    label: 'April',
    value: 'April',
  },
  {
    label: 'May',
    value: 'May',
  },
  {
    label: 'June',
    value: 'June',
  },
  {
    label: 'July',
    value: 'July',
  },
  {
    label: 'August',
    value: 'August',
  },
  {
    label: 'September',
    value: 'September',
  },
  {
    label: 'October',
    value: 'October',
  },
  {
    label: 'November',
    value: 'November',
  },
  {
    label: 'December',
    value: 'December',
  },
];

onMounted(async () => {
  initializeCookieValues();
});
</script>
<style lang="scss" scoped>
.updater-table .q-table__top {
  padding: 2px !important;
}
</style>
