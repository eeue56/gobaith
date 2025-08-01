package com.gobaith.eeue56;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().getDecorView().post(() -> {
            View rootView = findViewById(android.R.id.content);

            if (rootView != null) {
                rootView.setOnApplyWindowInsetsListener((v, insets) -> {
                        int bottom = insets.getSystemWindowInsetBottom();
                        int top = 0;
                        int left = insets.getSystemWindowInsetLeft();
                        int right = insets.getSystemWindowInsetRight();

                        v.setPadding(left, top, right, bottom);

                    return insets.consumeSystemWindowInsets();
                });

                rootView.requestApplyInsets();
            }
        });
    }
}