<template>
  <!-- Filters -->
  <q-list bordered class="q-pa-xs q-mb-sm">
    <q-expansion-item
      dense
      dense-toggle
      expand-separator
    >
    <template v-slot:header>
      <div class="row items-center justify-between full-width q-px-sm">
        <div>
          <q-icon name="search" size="xs" />
          <span class="text-subtitle2 q-ml-sm">Filters</span>
        </div>
        <div class="q-gutter-sm">
          <q-btn flat icon="backspace" color="negative" size="sm" @click.stop="clearFilters" />
        </div>
      </div>
    </template>
      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-3" v-for="col in filteredColumns" :key="col.name">
              <q-select
                flat
                dense
                v-model="col.filter"
                :options="col?.options"
                map-options
                emit-value
                option-label="label"
                option-value="value"
                :label="col?.label"
                @update:model-value="filterRowsByColumn"
              >
                <template v-if="col?.filter" v-slot:append>
                  <q-icon
                    name="cancel"
                    class="cursor-pointer"
                    @click.stop.prevent="col.filter = ''; clearEachFilter()"
                  />
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
  <!-- End Filters -->
  <!-- Report Table -->
  <q-table
    flat
    square
    :rows="rows"
    :columns="columns"
    row-key="id"
    bordered
    virtual-scroll
    :rows-per-page-options="[15, 25, 0]"
    class="sticky-header-table"
    :loading="loadingReportRows"
    :filter="filter"
  >
    <!-- Search -->
    <template v-slot:top-right>
      <q-input
        dense
        debounce="300"
        v-model="filter"
        placeholder="Search"
        input-class="search-options"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <!--/ End Search-->
    <!-- Generic Slot for All Cells with Q-EDIT-POPUP -->
    <template v-slot:body-cell="props">
      <q-td :props="props">
        <!-- This Code Below is used 3 lines below to Validate if a Logged User Can Update Information -->
        <!-- v-if="isWriteOnly || canInviteOrShare || isEditor || isAdmin" -- This code here is only to Give any IDEIA, the original is used below -->
        <template v-if="props.col.name !== 'actions'">
          <span v-if="getFieldType(props.col.name) === 'date'">
            <!-- if Date is grater than today, then show the date in red -->
             <q-chip dense color="positive" class="text-white" v-if="new Date(props.value) < new Date()">
              {{ formatDisplay(props.value, getFieldType(props.col.name)) }}
             </q-chip>
             <!-- If Date is about 30 days to today, then show the date in yellow -->
              <q-chip dense color="warning" class="text-white" v-else-if="new Date(props.value) >= new Date(new Date().setDate(new Date().getDate() - 30))">
                {{ formatDisplay(props.value, getFieldType(props.col.name)) }}
              </q-chip>
             <!-- if Date is less than today, then show the date in green -->
              <q-chip dense color="negative" class="text-white" v-else>
                {{ formatDisplay(props.value, getFieldType(props.col.name)) }}
              </q-chip>
          </span>
          <span v-else>
            {{ formatDisplay(props.value, getFieldType(props.col.name)) }}
          </span>
          <q-tooltip max-width="50%" anchor="center middle" self="top middle">
            {{ formatDisplay(props.value, getFieldType(props.col.name)) }}
          </q-tooltip>
          <q-popup-edit
            v-model="props.row[props.col.name]"
            auto-save
            v-slot="scope"
            v-if="isWriteOnly || canInviteOrShare || isEditor || isAdmin"
          >
            <template v-if="getFieldType(props.col.name) === 'date' || getFieldType(props.col.name) === 'data'">
              <q-date
                v-model="scope.value"
                mask="DD/MM/YYYY"
                @keyup.enter="scope.set"
                flat
                minimal
                :disable="props.col.disable && !isAdmin"
              />
            </template>
            <template v-else-if="props.col.name === 'status'">
              <q-select
                flat
                dense
                v-model="scope.value"
                :options="[
                  { label: 'Open', value: 'Open' },
                  { label: 'Closed', value: 'Closed' },
                  { label: 'Overdue', value: 'Overdue' },
                ]"
                @keyup.enter="scope.set"
                option-label="label"
                option-value="value"
                emit-value
                :disable="!isAdmin"
              />
            </template>
            <template v-else>
              <q-input
                :type="
                  getFieldType(props.col.name) === 'number'
                    ? 'number'
                    : 'textarea'
                "
                rows="3"
                v-model="scope.value"
                dense
                autofocus
                @keyup.enter="scope.set"
              />
            </template>
          </q-popup-edit>
        </template>
        <!-- Status Column -->
        <template v-else-if="props.col.name == 'status'">
          <q-chip
            v-if="props.row.status === 'Open'"
            color="green"
            text-color="white"
            dense
          >
            {{ props.row.status }}
          </q-chip>
          <span v-else>
            {{ props.row.status }}
          </span>
        </template>
        <!--/ End Status Column -->
        <!-- Actions Column -->
        <template v-else>
          <q-btn
            size="sm"
            icon="dynamic_feed"
            color="orange"
            flat
            round
            dense
            @click="duplicateRow(props.row, props.rowIndex)"
            :disable="!isAdmin"
          />
          <q-btn
            size="sm"
            icon="delete"
            color="negative"
            flat
            round
            dense
            @click="removerLinha(props.row, props.rowIndex)"
            :disable="!isAdmin"
          />
        </template>
        <!--/ End Actions Column -->
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getSingleReportById, updateReport } from 'src/boot/reports';
import { getGroupById } from 'src/boot/roles';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

const $q = useQuasar();
const route = useRoute();
const reportId = ref('');
const reportName = ref('');
const reportMonth = ref('');

const columns = ref([]);
const rows = ref([]);
const filteredColumns = ref([])
const filteredRows = ref([])

const filter = ref('');
const filterByDepartment = ref('');
const loadingReportRows = ref(false);

const isElectron = ref(false);
const isAdmin = ref(false);
const isEditor = ref(false);
const isViewer = ref(false);
const isAuditor = ref(false);

// Working with user permissions
const groupsIds = ref([]);
const groupsOfReport = ref([]);
const groupPermissions = ref([]);
const hasRead = ref([]);
const isReadOnly = ref(false);
const hasWrite = ref([]);
const isWriteOnly = ref(false);
const hasInviteOrShare = ref([]);
const canInviteOrShare = ref(false);

const lastClickTime = ref(0);

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

const emit = defineEmits(['reportDataToParent', 'clearUpdateReportData']);

const addNewRow = () => {
  const newRow = {};
  columns.value.forEach((col) => {
    newRow[col.name] = '---';
  });

  rows.value.push(newRow);
};

const removerLinha = (row, index) => {
  rows.value.splice(index, 1);
};

const saveUpdateReport = ({ name, month, newColumns, newRows }) => {
  const id = route.params.id;

  // Compare the new columns with the existing columns
  const newColumnNames = newColumns.map((col) => col.name);
  const existingColumnNames = columns.value
    .map((col) => col.name)
    .filter((name) => name !== 'actions');

  // The Lines bellow are used to compare the Columns
  // The ideia is to find is the New Loaded File has same Headers as the current file
  const added = [];
  const removed = [];

  // Remove duplicates from the arrays
  const setExisting = new Set(existingColumnNames);
  const setNew = new Set(newColumnNames);

  // Columns existenting in new ColumnNames but not in existingColumnNames
  for (const name of newColumnNames) {
    if (!setExisting.has(name)) added.push(name);
  }

  // Columns existenting in existingColumnNames but not in new ColumnNames
  for (const name of existingColumnNames) {
    if (!setNew.has(name)) removed.push(name);
  }

  // Notify That the file has different headers, witch means that the file is not compatible with the current file
  if (added.length > 0 && removed.length > 0) {
    $q.notify({
      icon: 'error',
      color: 'negative',
      message: `The new file has different headers. Please check the columns and try again.`,
    });
    return;
  }

  // TODO: on Hold
  // Work with the rows
  // Compare the new rows with the existing rows
  // const allRows = [...rows.value, ...newRows];
  // const uniqueRows = allRows.filter(
  //   (row, index, self) =>
  //     index === self.findIndex((r) => r.id === row.id)
  // );

  const report = {
    reportName: name, // Name passed from parent component
    reportMonth: month, // Month passed from parent component
    fileColumns: columns.value, // Use the same columns as the current file
    fileRows: newRows.length == 0 ? rows.value : newRows, // Use the same rows as the current file if new Rows is empty
  };

  updateReport(id, report)
    .then((response) => {
      $q.notify({
        color: 'positive',
        message: `${response?.message}` || 'Report updated successfully!',
        icon: 'check_circle',
      });

      // Update the Page
      emit('clearUpdateReportData');
      fetchReportData();
    })
    .catch((error) => {
      $q.notify({
        color: 'negative',
        message: 'Failed to update Report. Please try again.',
        icon: 'error',
      });
      console.error(error);
    });
};

// Utilities Methods
const getFieldType = (colName) => {
  // const name = colName.toLowerCase()
  const name = typeof colName === 'string' ? colName.toLowerCase() : '';

  if (name.includes('date') || name.includes('data')) {
    return 'date';
  }

  if (
    name.includes('amount') ||
    name.includes('total') ||
    name.includes('salary') ||
    name.includes('valor') ||
    name.includes('preco') ||
    name.includes('price')
  ) {
    return 'number';
  }

  return 'text';
};

const parseAnyDate = (value) => {
  if (typeof value !== 'string') return new Date(value);

  // Normaliza separadores ("/" → "-")
  const val = value.trim().replace(/\//g, '-');

  // YYYY-MM-DD → ex: 1988-08-30
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isValidDate(date) ? date : null;
  }

  // DD-MM-YYYY → ex: 30-08-1988
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
    const [d, m, y] = val.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isValidDate(date) ? date : null;
  }

  // Última tentativa: deixar o Date parser fazer o trabalho
  const fallback = new Date(val);
  return isValidDate(fallback) ? fallback : null;
};

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const formatDisplay = (value, type) => {
  if (type === 'date') {
    const d = parseAnyDate(value);
    return d
      ? new Intl.DateTimeFormat('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(d)
      : value;
  }

  if (type === 'number') {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value));
  }

  return value;
};

// Export to Excel
const exportToExcel = () => {
  filteredRows.value = rows.value.map((row) => {
    const newRow = {};
    filteredColumns.value.forEach((col) => {
      newRow[col?.name] = row[col?.name];
    });
    return newRow;
  });
  const plainRows = filteredRows.value;

  const worksheet = XLSX.utils.json_to_sheet(plainRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, 'Tracker.xlsx');
};

// Check if the columns have a "Date" column and disable it
// This must be updated only by Admin
const hasDateColumn = (columns) => {
  columns.some((c) => {
    const fieldName = c.field || c.name || '';
    fieldName.toLowerCase() === 'data' || fieldName.toLowerCase() === 'date';
    c.disable = true;
  });
};

const filterRowsByColumn = async () => {
  filteredRows.value = ref([...rows.value])

  rows.value = rows.value.filter(row => {
    return filteredColumns.value.every(col => {
      return !col.filter || row[col.field] === col.filter
    })
  })
};

const clearFilters = async () => {
  filteredRows.value = [];

  await fetchReportData();
};

const clearEachFilter = async () => {
  filteredRows.value = [];
  filteredColumns.value = [];
  filteredColumns.value = columns.value.map((col) => ({
    ...col,
    filter: null,
  }));
  await fetchReportData();
}

const fetchReportData = async () => {
  loadingReportRows.value = true;
  getSingleReportById(reportId.value)
    .then((response) => {
      //Assign the response to each corresponding variable
      reportName.value = response.report.reportName || '';
      reportMonth.value = response.report.reportMonth || '';
      groupsIds.value = response.report?.groups || [];

      //Columns and Rows
      rows.value = response.report.fileRows || [];
      columns.value = (response.report.fileColumns || []).map((col) => ({
        align: 'left',
        ...col,
      }));

      //Filter 'Actions' column from rows and Remove it
      filteredColumns.value = columns.value.filter(
        (col) => col?.name !== 'actions',
      );

      // Emit the report name to the parent component
      const payload = {
        name: reportName.value,
        month: reportMonth.value,
      };
      emit('reportDataToParent', payload);

      hasDateColumn(columns.value);
      loadingReportRows.value = false;

      getReportsGroupsById(groupsIds.value);
    })
    .catch((error) => {
      console.error(error);
      loadingReportRows.value = false;
    });
};

// Fetch groups by IDs and extract permissions
const getReportsGroupsById = async (groupsIds) => {
  groupsOfReport.value = [];
  groupPermissions.value = [];

  // Executes multiple fetches in parallel and waits for all
  const groups = await Promise.all(groupsIds.map((id) => getGroupById(id)));

  // Keep found groups
  groupsOfReport.value = groups;

  // Extract permissions from each group
  groupPermissions.value = groups.flatMap(
    (group) => group?.userPermissions || [],
  );

  // Remove duplicates from groupPermissions
  groupPermissions.value = [...new Set(groupPermissions.value)];

  hasRead.value = (columns.value || []).map((col, i) => {
    const hasPermission =
      Array.isArray(col?.permissions) &&
      groupPermissions.value.includes('read');
    return hasPermission;
  });
  hasWrite.value = (columns.value || []).map((col, i) => {
    const hasPermission =
      Array.isArray(col?.permissions) &&
      groupPermissions.value.includes('write');
    return hasPermission;
  });
  hasInviteOrShare.value = (columns.value || []).map((col, i) => {
    const hasPermission =
      Array.isArray(col?.permissions) &&
      groupPermissions.value.includes('invite_member');
    return hasPermission;
  });

  // Set isReadOnly to TRUE if hasRead values are all TRUE, except the first value
  isReadOnly.value = hasRead.value.every((val, index) => {
    if (index === 0) return true; // Skip the first value
    return val === true;
  });
  // Set isWriteOnly to TRUE if hasWrite values are all TRUE, except the first value
  isWriteOnly.value = hasWrite.value.every((val, index) => {
    if (index === 0) return true; // Skip the first value
    return val === true;
  });
  // Set canInviteOrShare to TRUE if hasInviteOrShare values are all TRUE, except the first value
  canInviteOrShare.value = hasInviteOrShare.value.every((val, index) => {
    if (index === 0) return true; // Skip the first value
    return val === true;
  });
};

// Dubplicate row right below the current row
const duplicateRow = (row, index) => {
  const newRow = { ...row };
  rows.value.splice(index + 1, 0, newRow);

  $q.notify({
    color: 'positive',
    message: 'Row duplicated successfully!',
    icon: 'check_circle',
  });
};

onMounted(async () => {
  reportId.value = route.params.id;
  await fetchReportData();

  // Initialize cookie values
  await initializeCookieValues();
});

watch(rows, () => {
  filteredColumns.value.forEach(col => {
    const uniqueValues = [...new Set(rows.value.map(row => row[col.field]))]
    col.options = uniqueValues.map(v => ({ label: String(v), value: v }))
  })
}, { immediate: true })

const deptSelectOptions = [
  { label: 'All', value: 'All' },
  { label: 'AML', value: 'AML' },
  { label: 'Business & Payments', value: 'Business & Payments' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Core & Digital', value: 'Core & Digital' },
  { label: 'Customer Service', value: 'Customer Service' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Financial Services', value: 'Financial Services' },
  { label: 'Human Resources', value: 'Human Resources' },
  { label: 'IT', value: 'IT' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Risk', value: 'Risk' },
  { label: 'Sales', value: 'Sales' },
  { label: 'Support', value: 'Support' },
  { label: 'Technology', value: 'Technology' },
];

const formatLongText = (text) => {
  const words = text.split(' ');
  const first = words.slice(0, 400).join(' ');
  const rest = words.slice(400).join(' ');

  return `<span>${first}</span> <span style="word-spacing: 0.5em">${rest}</span>`;
};

defineExpose({
  addNewRow,
  saveUpdateReport,
  exportToExcel,
});
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

// Columns minimum width 500px

.q-table tbody td
  max-width: 500px !important;
  word-spacing: normal !important
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #00b4ff

  thead tr th
    position: sticky
    z-index: 1
    max-width: 500px !important
    white-space: normal !important
    border: 1px dotted red !important
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px

  /* prevent scrolling behind sticky top row on focus */
  tbody
    /* height of all previous header rows */
    scroll-margin-top: 48px
</style>
