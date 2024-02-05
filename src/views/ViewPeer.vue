import { NFlex } from 'naive-ui';
<template>
  <n-flex align="center" justify="center" class="h-100">
    <n-form ref="formRef" :model="formValue" :rules="rules" size="large">
      <n-form-item label="Name" path="username">
        <n-input
          v-model:value="formValue.username"
          placeholder="Input your name"
        />
      </n-form-item>
      <n-button
        :loading="loading"
        size="large"
        @click.prevent="handleSubmit"
        block
      >
        Connect
      </n-button>
    </n-form>
  </n-flex>
</template>

<script setup>
import { ref } from 'vue';
import { NButton, NForm, NFormItem, NInput, NFlex } from 'naive-ui';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const loading = ref(false);
const formRef = ref(null);
const formValue = ref({
  username: '',
});

const rules = {
  username: {
    required: true,
  },
};

const handleSubmit = async () => {
  try {
    loading.value = true;
    await formRef.value?.validate();
    await peer.connect(formValue.value);
  } catch {
    //
  } finally {
    loading.value = false;
  }
};
</script>
