package ai.myraa.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MyraaNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
